import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Uploads a file buffer to S3 and returns its URL.
 * @param {object} file - The file object (expects buffer, originalname, mimetype).
 * @param {string} [folder='uploads'] - Optional folder prefix in bucket.
 * @returns {Promise<string>} - The S3 file URL.
 */
export async function uploadFileToS3(file, folder = 'uploads') {
  const key = `${folder}/${uuidv4()}_${file.originalname}`;
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  const { Location } = await s3.upload(params).promise();
  return Location;
}