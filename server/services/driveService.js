const { google } = require('googleapis');
const { Readable } = require('stream');
const logger = require('../utils/logger');

/**
 * Google Drive Service — handles file uploads, deletion, and folder management.
 * Uses a service account for authentication.
 */
class DriveService {
  constructor() {
    this.drive = null;
    this.folderCache = {};
  }

  /**
   * Initialize the Google Drive API client.
   */
  _getClient() {
    if (this.drive) return this.drive;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
    return this.drive;
  }

  /**
   * Convert a buffer to a readable stream.
   * @param {Buffer} buffer
   * @returns {Readable}
   */
  _bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  /**
   * Get or create a subfolder within the root Drive folder.
   * @param {string} folderName
   * @returns {Promise<string>} Folder ID
   */
  async _getOrCreateFolder(folderName) {
    if (this.folderCache[folderName]) {
      return this.folderCache[folderName];
    }

    const drive = this._getClient();
    const parentId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Check if folder exists
    const response = await drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files.length > 0) {
      this.folderCache[folderName] = response.data.files[0].id;
      return response.data.files[0].id;
    }

    // Create folder
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    this.folderCache[folderName] = folder.data.id;
    logger.info(`Created Drive folder: ${folderName} (${folder.data.id})`);
    return folder.data.id;
  }

  /**
   * Upload a file to Google Drive.
   * @param {Buffer} fileBuffer - File content
   * @param {string} fileName - File name
   * @param {string} mimeType - MIME type
   * @param {string} folderName - Subfolder name (e.g., 'Resumes')
   * @returns {Promise<{fileId: string, webViewLink: string}>}
   */
  async uploadFile(fileBuffer, fileName, mimeType, folderName) {
    try {
      const drive = this._getClient();
      const folderId = await this._getOrCreateFolder(folderName);

      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: this._bufferToStream(fileBuffer),
        },
        fields: 'id, webViewLink, webContentLink',
      });

      // Make file accessible via link
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      logger.info(`File uploaded to Drive: ${fileName} (${response.data.id})`);

      return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
        webContentLink: response.data.webContentLink || '',
      };
    } catch (error) {
      logger.error('Drive upload error:', error);
      throw new Error(`Failed to upload file to Google Drive: ${error.message}`);
    }
  }

  /**
   * Delete a file from Google Drive.
   * @param {string} fileId
   */
  async deleteFile(fileId) {
    try {
      if (!fileId) return;
      const drive = this._getClient();
      await drive.files.delete({ fileId });
      logger.info(`File deleted from Drive: ${fileId}`);
    } catch (error) {
      logger.error(`Drive delete error for ${fileId}:`, error);
    }
  }

  /**
   * Download a file from Google Drive as a binary Buffer.
   * Used primarily to fetch custom certificate template backgrounds for PDF compilation.
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<Buffer>} File content as a Buffer
   */
  async downloadFile(fileId) {
    try {
      if (!fileId) {
        throw new Error('File ID is required for download');
      }
      const drive = this._getClient();
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      logger.info(`File downloaded from Drive: ${fileId}`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Drive download error for ${fileId}:`, error);
      throw new Error(`Failed to download file from Google Drive: ${error.message}`);
    }
  }

  /**
   * Get file metadata from Google Drive.
   * @param {string} fileId
   * @returns {Promise<object>} File metadata
   */
  async getFileMetadata(fileId) {
    try {
      const drive = this._getClient();
      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
      });
      return response.data;
    } catch (error) {
      logger.error(`Drive metadata error for ${fileId}:`, error);
      throw new Error('Failed to get file metadata from Google Drive');
    }
  }
}

module.exports = new DriveService();
