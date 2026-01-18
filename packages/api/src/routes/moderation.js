const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticateRequest } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { auditMiddleware } = require('../utils/audit');
const logger = require('../utils/logger');

// Apply authentication and audit middleware to all routes
router.use(authenticateRequest);
router.use(auditMiddleware);

/**
 * POST /api/moderation/report
 * Submit a user report
 * Available to all authenticated users
 * Auto-flags user after 3+ pending reports
 */
router.post('/report', async (req, res) => {
  try {
    const { 
      reportedUserId, 
      reportedMessageId, 
      reportedItemId,
      reportReason, 
      reportDetails 
    } = req.body;

    // Validation
    if (!reportedUserId && !reportedMessageId && !reportedItemId) {
      return res.status(400).json({ 
        error: 'Must specify reportedUserId, reportedMessageId, or reportedItemId' 
      });
    }

    if (!reportReason) {
      return res.status(400).json({ error: 'reportReason is required' });
    }

    // Prevent self-reporting
    if (reportedUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    // Create the report
    const report = await prisma.userReport.create({
      data: {
        reporterId: req.userId,
        reportedUserId,
        reportedMessageId,
        reportedItemId,
        reportReason,
        reportDetails,
        status: 'PENDING'
      }
    });

    // Auto-flagging logic: Check if user has 3+ pending reports
    if (reportedUserId) {
      const pendingReportsCount = await prisma.userReport.count({
        where: {
          reportedUserId,
          status: 'PENDING'
        }
      });

      // Auto-flag user if threshold reached
      if (pendingReportsCount >= 3) {
        await prisma.user.update({
          where: { id: reportedUserId },
          data: { isFlagged: true }
        });

        logger.info(`User ${reportedUserId} auto-flagged after ${pendingReportsCount} reports`);

        // Create audit log for auto-flagging
        await req.auditLog.create('USER_AUTO_FLAGGED', {
          reportedUserId,
          pendingReportsCount,
          reportId: report.id
        });
      }
    }

    // Create audit log for report submission
    await req.auditLog.create('USER_REPORT_SUBMITTED', {
      reportId: report.id,
      reportedUserId,
      reportedMessageId,
      reportedItemId,
      reportReason
    });

    res.status(201).json({ 
      message: 'Report submitted successfully', 
      report 
    });
  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

/**
 * POST /api/moderation/action
 * Take a moderation action
 * Available to MODERATOR and ADMIN roles only
 * Supports: WARNING, MUTE, KICK, BAN_TEMP, BAN_PERMANENT, MESSAGE_DELETE, ITEM_REMOVE
 */
router.post('/action', requireRole(['MODERATOR', 'ADMIN']), async (req, res) => {
  try {
    const {
      targetUserId,
      targetMessageId,
      targetItemId,
      actionType,
      reason,
      duration // in minutes for temporary actions
    } = req.body;

    // Validation
    if (!targetUserId && !targetMessageId && !targetItemId) {
      return res.status(400).json({ 
        error: 'Must specify targetUserId, targetMessageId, or targetItemId' 
      });
    }

    if (!actionType) {
      return res.status(400).json({ error: 'actionType is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    // Calculate expiration for temporary actions
    let expiresAt = null;
    if ((actionType === 'BAN_TEMP' || actionType === 'MUTE') && duration) {
      expiresAt = new Date(Date.now() + duration * 60 * 1000);
    }

    // Create moderation action
    const moderationAction = await prisma.moderationAction.create({
      data: {
        moderatorId: req.userId,
        targetUserId,
        targetMessageId,
        targetItemId,
        actionType,
        reason,
        duration,
        expiresAt,
        isActive: true
      }
    });

    // Apply the action to the user
    if (targetUserId) {
      const updateData = {};

      switch (actionType) {
        case 'MUTE':
          updateData.isMuted = true;
          updateData.muteExpiresAt = expiresAt;
          break;
        case 'BAN_TEMP':
          updateData.isBanned = true;
          updateData.banExpiresAt = expiresAt;
          updateData.accountStatus = 'BANNED';
          break;
        case 'BAN_PERMANENT':
          updateData.isBanned = true;
          updateData.accountStatus = 'BANNED';
          updateData.banReason = reason;
          break;
        case 'KICK':
          // Kick is handled by Socket.IO, no user update needed
          break;
        case 'WARNING':
          // Warning is logged but doesn't change user status
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: updateData
        });
      }
    }

    // Handle message deletion
    if (targetMessageId && actionType === 'MESSAGE_DELETE') {
      await prisma.chatMessage.update({
        where: { id: targetMessageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: req.userId
        }
      });
    }

    // Handle marketplace item removal
    if (targetItemId && actionType === 'ITEM_REMOVE') {
      await prisma.marketplaceItem.update({
        where: { id: targetItemId },
        data: { status: 'REMOVED' }
      });
    }

    // Create audit log
    await req.auditLog.create('MODERATION_ACTION_TAKEN', {
      moderationActionId: moderationAction.id,
      actionType,
      targetUserId,
      targetMessageId,
      targetItemId,
      reason,
      duration,
      expiresAt
    });

    logger.info(`Moderation action ${actionType} taken by ${req.userId} against ${targetUserId || targetMessageId || targetItemId}`);

    res.status(201).json({ 
      message: 'Moderation action applied successfully', 
      moderationAction 
    });
  } catch (error) {
    logger.error('Error taking moderation action:', error);
    res.status(500).json({ error: 'Failed to take moderation action' });
  }
});

/**
 * GET /api/moderation/logs
 * Get moderation action logs
 * Available to MODERATOR and ADMIN roles only
 * Supports filtering by targetUserId, moderatorId, actionType
 */
router.get('/logs', requireRole(['MODERATOR', 'ADMIN']), async (req, res) => {
  try {
    const { targetUserId, moderatorId, actionType, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (targetUserId) where.targetUserId = targetUserId;
    if (moderatorId) where.moderatorId = moderatorId;
    if (actionType) where.actionType = actionType;

    const [logs, total] = await Promise.all([
      prisma.moderationAction.findMany({
        where,
        include: {
          moderator: {
            select: { id: true, permanentUsername: true, preferredName: true }
          },
          targetUser: {
            select: { id: true, permanentUsername: true, preferredName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.moderationAction.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching moderation logs:', error);
    res.status(500).json({ error: 'Failed to fetch moderation logs' });
  }
});

/**
 * GET /api/moderation/reports
 * Get user reports
 * Available to MODERATOR and ADMIN roles only
 * Supports filtering by status, reportedUserId
 */
router.get('/reports', requireRole(['MODERATOR', 'ADMIN']), async (req, res) => {
  try {
    const { status, reportedUserId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (reportedUserId) where.reportedUserId = reportedUserId;

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, permanentUsername: true, preferredName: true }
          },
          reportedUser: {
            select: { id: true, permanentUsername: true, preferredName: true }
          },
          reviewedBy: {
            select: { id: true, permanentUsername: true, preferredName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.userReport.count({ where })
    ]);

    res.json({
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * POST /api/moderation/reports/:id/review
 * Review a user report
 * Available to MODERATOR and ADMIN roles only
 */
router.post('/reports/:id/review', requireRole(['MODERATOR', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED', 'REJECTED'

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (APPROVED/REJECTED) is required' });
    }

    const report = await prisma.userReport.update({
      where: { id },
      data: {
        status,
        reviewedById: req.userId,
        reviewedAt: new Date()
      }
    });

    // Create audit log
    await req.auditLog.create('REPORT_REVIEWED', {
      reportId: id,
      status,
      reviewerId: req.userId
    });

    res.json({ message: 'Report reviewed successfully', report });
  } catch (error) {
    logger.error('Error reviewing report:', error);
    res.status(500).json({ error: 'Failed to review report' });
  }
});

/**
 * POST /api/moderation/appeal
 * Submit an appeal for a moderation action
 * Available to all authenticated users
 */
router.post('/appeal', async (req, res) => {
  try {
    const { moderationActionId, reason } = req.body;

    if (!moderationActionId || !reason) {
      return res.status(400).json({ error: 'moderationActionId and reason are required' });
    }

    // Verify the moderation action exists and targets the current user
    const moderationAction = await prisma.moderationAction.findUnique({
      where: { id: moderationActionId }
    });

    if (!moderationAction) {
      return res.status(404).json({ error: 'Moderation action not found' });
    }

    if (moderationAction.targetUserId !== req.userId) {
      return res.status(403).json({ error: 'Can only appeal actions against yourself' });
    }

    // Check if appeal already exists
    const existingAppeal = await prisma.moderationAppeal.findFirst({
      where: {
        moderationActionId,
        userId: req.userId
      }
    });

    if (existingAppeal) {
      return res.status(400).json({ error: 'Appeal already submitted for this action' });
    }

    // Create the appeal
    const appeal = await prisma.moderationAppeal.create({
      data: {
        userId: req.userId,
        moderationActionId,
        reason,
        status: 'PENDING'
      }
    });

    // Create audit log
    await req.auditLog.create('MODERATION_APPEAL_SUBMITTED', {
      appealId: appeal.id,
      moderationActionId,
      userId: req.userId
    });

    res.status(201).json({ 
      message: 'Appeal submitted successfully', 
      appeal 
    });
  } catch (error) {
    logger.error('Error submitting appeal:', error);
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
});

/**
 * GET /api/moderation/appeals
 * Get moderation appeals
 * MODERATOR/ADMIN: View all appeals
 * USER: View only their own appeals
 */
router.get('/appeals', async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const userRole = req.userRole;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;

    // Regular users can only see their own appeals
    if (!userRole || !['MODERATOR', 'ADMIN'].includes(userRole)) {
      where.userId = req.userId;
    }

    const [appeals, total] = await Promise.all([
      prisma.moderationAppeal.findMany({
        where,
        include: {
          user: {
            select: { id: true, permanentUsername: true, preferredName: true }
          },
          moderationAction: {
            include: {
              moderator: {
                select: { id: true, permanentUsername: true, preferredName: true }
              }
            }
          },
          reviewedBy: {
            select: { id: true, permanentUsername: true, preferredName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.moderationAppeal.count({ where })
    ]);

    res.json({
      appeals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching appeals:', error);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

/**
 * POST /api/moderation/appeals/:id/review
 * Review a moderation appeal
 * Available to MODERATOR and ADMIN roles only
 * Can approve (reverse action) or reject the appeal
 */
router.post('/appeals/:id/review', requireRole(['MODERATOR', 'ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body; // 'APPROVED', 'REJECTED'

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (APPROVED/REJECTED) is required' });
    }

    // Update the appeal
    const appeal = await prisma.moderationAppeal.update({
      where: { id },
      data: {
        status,
        reviewedById: req.userId,
        reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        moderationAction: true
      }
    });

    // If appeal is approved, reverse the moderation action
    if (status === 'APPROVED' && appeal.moderationAction) {
      const action = appeal.moderationAction;

      // Deactivate the original moderation action
      await prisma.moderationAction.update({
        where: { id: action.id },
        data: { isActive: false }
      });

      // Reverse the action on the user
      if (action.targetUserId) {
        const updateData = {};

        switch (action.actionType) {
          case 'MUTE':
            updateData.isMuted = false;
            updateData.muteExpiresAt = null;
            break;
          case 'BAN_TEMP':
          case 'BAN_PERMANENT':
            updateData.isBanned = false;
            updateData.banExpiresAt = null;
            updateData.accountStatus = 'ACTIVE';
            updateData.banReason = null;
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: action.targetUserId },
            data: updateData
          });
        }
      }

      logger.info(`Appeal ${id} approved - moderation action ${action.id} reversed`);
    }

    // Create audit log
    await req.auditLog.create('APPEAL_REVIEWED', {
      appealId: id,
      status,
      reviewerId: req.userId,
      moderationActionId: appeal.moderationActionId
    });

    res.json({ 
      message: 'Appeal reviewed successfully', 
      appeal 
    });
  } catch (error) {
    logger.error('Error reviewing appeal:', error);
    res.status(500).json({ error: 'Failed to review appeal' });
  }
});

/**
 * GET /api/moderation/audit
 * Get audit logs
 * Available to ADMIN role only
 */
router.get('/audit', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { userId, eventType, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, permanentUsername: true, preferredName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
