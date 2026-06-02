const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const logger = require('../utils/logger');
const https = require('https');

// Cloudinary configuration relies on environment variables
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

class CloudinaryService {
  /**
   * Uploads a file buffer to Cloudinary
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} folder - Destination folder in Cloudinary
   * @param {string} resourceType - 'image', 'video', 'raw', 'auto'
   * @returns {Promise<{publicId: string, secureUrl: string, size: number, format: string}>}
   */
  uploadFile(fileBuffer, folder = 'internhub', resourceType = 'auto') {
    return new Promise((resolve, reject) => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return reject(new Error('Cloudinary credentials are not configured.'));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          upload_preset: 'interns',
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
          }
          logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            size: result.bytes,
            format: result.format,
          });
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary by its public ID
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Type of resource ('image', 'raw', 'video')
   */
  async deleteFile(publicId, resourceType = 'image') {
    if (!publicId) return;
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) return;
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      logger.info(`File deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.warn(`Cloudinary delete error for ${publicId}: ${error.message}`);
    }
  }

  /**
   * Downloads a file from Cloudinary into a Buffer
   * Used to fetch background images for PDF generation
   * @param {string} secureUrl - The Cloudinary secure_url
   * @returns {Promise<Buffer>}
   */
  async downloadFile(secureUrl) {
    if (!secureUrl) {
      throw new Error('Secure URL is required to download file');
    }

    return new Promise((resolve, reject) => {
      https
        .get(secureUrl, (response) => {
          if (response.statusCode !== 200) {
            return reject(new Error(`Failed to download file, status code: ${response.statusCode}`));
          }
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
        })
        .on('error', (err) => {
          logger.error(`Error downloading from Cloudinary: ${err.message}`);
          reject(err);
        });
    });
  }

  /**
   * Generate an attachment download URL for a Cloudinary resource
   * @param {string} publicId 
   * @param {string} resourceType 
   * @param {string} format 
   * @returns {string} Downloadable URL
   */
  getAttachmentUrl(publicId, resourceType = 'image', format = 'png') {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      format,
      flags: 'attachment',
      secure: true,
    });
  }
}

module.exports = new CloudinaryService();
