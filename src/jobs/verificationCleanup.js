const { prisma } = require('../../lib/prisma');
const documentUploadService = require('../../services/documentUpload');
const logger = require('../../utils/logger');

class VerificationCleanupJob {
  start() {
    // Run daily at 2 AM server time
    const cron = require('node-cron');
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running verification cleanup job...');
      await this.cleanupExpiredVerifications();
    });
    logger.info('Verification cleanup job scheduled (daily at 02:00)');
  }

  async cleanupExpiredVerifications() {
    try {
      const retentionDays = parseInt(process.env.VERIFICATION_RETENTION_DAYS || '90', 10);
      const rows = await prisma.$queryRaw`
        SELECT id, s3_key, selfie_s3_key FROM id_verifications
        WHERE status IN ('APPROVED', 'REJECTED')
          AND created_at < NOW() - INTERVAL ${retentionDays} DAY
          AND status != 'DELETED'
      `;

      for (const record of rows) {
        try {
          // delete documents from storage (S3) and mark verification deleted
          await documentUploadService.deleteDocument(record.s3_key).catch(e => logger.warn('deleteDocument failed', e));
          if (record.selfie_s3_key) await documentUploadService.deleteDocument(record.selfie_s3_key).catch(e => logger.warn('delete selfie failed', e));
          await prisma.id_verifications.update({ where: { id: record.id }, data: { status: 'DELETED', processed_at: new Date() } }).catch(() => {});
          await prisma.verification_retention_policy.create({ data: { verification_id: record.id, deletion_scheduled_at: new Date(), deleted_at: new Date() } }).catch(() => {});
          logger.info(`Deleted verification: ${record.id}`);
        } catch (inner) {
          logger.error('Failed to delete verification', record.id, inner);
        }
      }

      logger.info(`Cleanup complete. Processed ${rows.length} verifications.`);
    } catch (error) {
      logger.error('Cleanup job error:', error);
    }
  }
}

module.exports = new VerificationCleanupJob();
