const logger = require('../utils/logger');
const { S3Client, DeleteObjectCommand } = (() => {
  try {
    return require('@aws-sdk/client-s3');
  } catch (e) {
    return {};
  }
})();

let s3Client = null;
if (S3Client) {
  s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
}

async function deleteDocument(s3Key) {
  if (!s3Key) return;
  if (!s3Client) {
    logger.info('S3 client not configured — skipping delete for', s3Key);
    return;
  }
  try {
    const cmd = new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: s3Key });
    await s3Client.send(cmd);
    logger.info('Deleted S3 object', s3Key);
  } catch (e) {
    logger.error('S3 delete failed for', s3Key, e);
    throw e;
  }
}

module.exports = { deleteDocument };
