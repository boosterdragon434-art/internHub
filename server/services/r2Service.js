const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const http = require('http');
const mime = require('mime-types');
const logger = require('../utils/logger');

/**
 * Cloudflare R2 Storage Service.
 *
 * S3-compatible object storage — drop-in replacement for the former CloudinaryService.
 * All public methods maintain the same interface for seamless controller compatibility.
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 */

/** Validate that all required R2 environment variables are present. */
const validateConfig = () => {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `R2 configuration incomplete. Missing environment variables: ${missing.join(', ')}`
    );
  }
};

/**
 * Lazily initialised S3Client instance.
 * Created on first use to allow dotenv to load before construction.
 * @type {S3Client|null}
 */
let s3Client = null;

/**
 * Returns the singleton S3Client, creating it on first call.
 * @returns {S3Client}
 */
const getClient = () => {
  if (!s3Client) {
    validateConfig();

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return s3Client;
};

/**
 * MIME-type magic-byte signatures for common file formats.
 * Used to detect the actual file type from buffer contents.
 */
const MAGIC_BYTES = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (also check offset 8-11 for WEBP)
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};

/**
 * Detect MIME type from buffer magic bytes.
 * Falls back to 'application/octet-stream' if unrecognised.
 * @param {Buffer} buffer - File buffer
 * @returns {string} Detected MIME type
 */
const detectMimeType = (buffer) => {
  if (!buffer || buffer.length < 4) return 'application/octet-stream';

  for (const [mimeType, signature] of Object.entries(MAGIC_BYTES)) {
    if (mimeType === 'image/webp') {
      // RIFF container — verify WEBP at offset 8
      if (
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      ) {
        return 'image/webp';
      }
      continue;
    }

    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return mimeType;
  }

  return 'application/octet-stream';
};

/**
 * Derive the file extension from a MIME type.
 * @param {string} mimeType
 * @returns {string}
 */
const getExtensionFromMime = (mimeType) => {
  return mime.extension(mimeType) || 'bin';
};

class R2Service {
  /**
   * Uploads a file buffer to Cloudflare R2.
   *
   * @param {Buffer} fileBuffer - File buffer to upload
   * @param {string} folder - Destination folder (e.g. 'internhub/resumes')
   * @param {string} _resourceType - Kept for API compatibility (unused in R2)
   * @returns {Promise<{publicId: string, secureUrl: string, size: number, format: string}>}
   */
  async uploadFile(fileBuffer, folder = 'internhub', _resourceType = 'auto') {
    const client = getClient();

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Cannot upload an empty file buffer.');
    }

    // Detect content type from buffer magic bytes
    const contentType = detectMimeType(fileBuffer);
    const ext = getExtensionFromMime(contentType);

    // Generate a collision-resistant object key
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const objectKey = `${folder}/${uniqueId}-${timestamp}.${ext}`;

    // Compute MD5 for upload integrity verification
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('base64');

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
      ContentMD5: md5Hash,
      ContentLength: fileBuffer.length,
    });

    try {
      await client.send(command);
    } catch (error) {
      logger.error(`R2 upload failed for key "${objectKey}": ${error.message}`);
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }

    const publicUrl = process.env.R2_PUBLIC_URL.replace(/\/+$/, '');
    const secureUrl = `${publicUrl}/${objectKey}`;

    logger.info(`File uploaded to R2: ${objectKey} (${fileBuffer.length} bytes)`);

    return {
      publicId: objectKey,
      secureUrl,
      size: fileBuffer.length,
      format: ext,
    };
  }

  /**
   * Deletes a file from R2 by its object key (publicId).
   *
   * @param {string} publicId - R2 object key (or legacy Cloudinary public ID)
   * @param {string} _resourceType - Kept for API compatibility (unused in R2)
   */
  async deleteFile(publicId, _resourceType = 'image') {
    if (!publicId) return;

    const client = getClient();

    try {
      // Verify the object exists before attempting deletion
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: publicId,
      });

      try {
        await client.send(headCommand);
      } catch (headError) {
        // Object doesn't exist — might be a legacy Cloudinary ID, skip silently
        if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
          logger.warn(`R2 delete skipped — object not found (possibly legacy Cloudinary ID): ${publicId}`);
          return;
        }
        throw headError;
      }

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: publicId,
      });

      await client.send(deleteCommand);
      logger.info(`File deleted from R2: ${publicId}`);
    } catch (error) {
      logger.warn(`R2 delete error for "${publicId}": ${error.message}`);
    }
  }

  /**
   * Downloads a file from its public URL into a Buffer.
   * Supports both R2 public URLs and legacy Cloudinary URLs.
   *
   * @param {string} secureUrl - The public URL of the file
   * @returns {Promise<Buffer>}
   */
  async downloadFile(secureUrl) {
    if (!secureUrl) {
      throw new Error('URL is required to download file.');
    }

    return new Promise((resolve, reject) => {
      const protocol = secureUrl.startsWith('https') ? https : http;

      protocol
        .get(secureUrl, (response) => {
          // Handle redirects (3xx)
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return this.downloadFile(response.headers.location).then(resolve).catch(reject);
          }

          if (response.statusCode !== 200) {
            return reject(
              new Error(`Failed to download file, status code: ${response.statusCode}`)
            );
          }

          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', (err) => reject(err));
        })
        .on('error', (err) => {
          logger.error(`Error downloading file from ${secureUrl}: ${err.message}`);
          reject(err);
        });
    });
  }

  /**
   * Generate a public download URL for an R2 object.
   * For R2 this is simply the public URL with the key appended.
   *
   * @param {string} publicId - R2 object key
   * @param {string} _resourceType - Kept for API compatibility
   * @param {string} _format - Kept for API compatibility
   * @returns {string} Public download URL
   */
  getAttachmentUrl(publicId, _resourceType = 'image', _format = 'png') {
    if (!publicId) return '';

    const publicUrl = process.env.R2_PUBLIC_URL.replace(/\/+$/, '');
    return `${publicUrl}/${publicId}`;
  }
}

module.exports = new R2Service();
