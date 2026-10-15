const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE, sanitizeLogData } = require('../../shared/schemas');

/**
 * GET /:loungeId - Fetch message history for a lounge with cursor-based pagination
 *
 * Query parameters:
 * - cursor: Optional. The ID of the last message from the previous page
 * - limit: Optional. Page size with a hard cap of 50
 *
 * Response format:
 * {
 *   messages: ChatMessage[],
 *   pagination: {
 *     hasMore: boolean,
 *     nextCursor: string | null
 *   }
 * }
 */
router.get('/:loungeId', auth, async (req, res) => {
  try {
    const { loungeId } = req.params;
    const { cursor, limit } = req.query;
    const requestedLimit = Number(limit);
    const pageSize = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

    if (!loungeId || typeof loungeId !== 'string') {
      return res.status(400).json({ error: 'Invalid loungeId' });
    }

    if (limit !== undefined && (!Number.isFinite(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_PAGE_SIZE)) {
      return res.status(400).json({ error: 'Invalid limit', details: `Limit must be between 1 and ${MAX_PAGE_SIZE}` });
    }

    const queryOptions = {
      where: {
        loungeId: loungeId,
        isDeleted: false,
      },
      take: pageSize + 1,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        loungeId: true,
        languageRoomId: true,
        userId: true,
        displayUsername: true,
        messageText: true,
        messageType: true,
        attachmentUrl: true,
        isEdited: true,
        editedAt: true,
        createdAt: true,
      },
    };

    if (cursor && typeof cursor === 'string') {
      try {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1;
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid cursor format',
          details: 'Cursor must be a valid message ID'
        });
      }
    }

    const messages = await prisma.chatMessage.findMany(queryOptions);
    const hasMore = messages.length > pageSize;
    const resultMessages = hasMore ? messages.slice(0, pageSize) : messages;
    const nextCursor = hasMore && resultMessages.length > 0
      ? resultMessages[resultMessages.length - 1].id
      : null;

    res.json({
      messages: resultMessages,
      pagination: {
        hasMore,
        nextCursor,
        pageSize,
      },
    });
  } catch (error) {
    logger.error('Error fetching message history:', sanitizeLogData(error));

    if (error && error.message && error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Invalid request parameters'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch message history',
      message: 'An internal error occurred while retrieving messages'
    });
  }
});

module.exports = router;
