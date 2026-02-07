// Cloudflare R2 Upload Utility using AWS SDK v2
import AWS from 'aws-sdk';

// Configure R2 endpoint
const s3 = new AWS.S3({
  endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto',
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

/**
 * Upload file to Cloudflare R2
 * @param {File} file - File object from input
 * @param {string} folder - Folder path (e.g., 'covers', 'documents', 'images')
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export const uploadToR2 = async (file, folder = 'uploads') => {
  if (!file) throw new Error('No file provided');

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = file.name.split('.').pop();
  const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: file.type,
  };

  try {
    await s3.putObject(params).promise();
    return `${PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error('Failed to upload file to R2');
  }
};

/**
 * Delete file from R2
 * @param {string} fileUrl - Full URL of file to delete
 */
export const deleteFromR2 = async (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith(PUBLIC_URL)) return;

  // Extract key from URL
  const key = fileUrl.replace(`${PUBLIC_URL}/`, '');

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('R2 Delete Error:', error);
    throw new Error('Failed to delete file from R2');
  }
};

/**
 * Upload multiple files
 * @param {FileList|File[]} files - Array of files
 * @param {string} folder - Target folder
 * @returns {Promise<string[]>} - Array of public URLs
 */
export const uploadMultipleToR2 = async (files, folder = 'uploads') => {
  const uploadPromises = Array.from(files).map((file) =>
    uploadToR2(file, folder)
  );
  return Promise.all(uploadPromises);
};
