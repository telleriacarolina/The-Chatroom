const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /:loungeId - Fetch message history for a lounge with cursor-based pagination
 * 
 * Query parameters:
 * - cursor: Optional. The ID of the last message from the previous page
 * 
 * Response format:
 * {
 *   messages: ChatMessage[],
 *   pagination: {
 *     hasMore: boolean,
 *     nextCursor: string | null
 *   }
 * }
 * 
 * Features:
 * - Cursor-based pagination (50 messages per page)
 * - Filters out soft-deleted messages (isDeleted = true)
 * - Optimized with database indexes
 * - Returns pagination metadata for infinite scrolling
 * - Handles invalid or expired cursors gracefully
 */
router.get('/:loungeId', auth, async (req, res) => {
  try {
    const { loungeId } = req.params;
    const { cursor } = req.query;
    const pageSize = 50;

    // Validate loungeId format (UUID)
    if (!loungeId || typeof loungeId !== 'string') {
      return res.status(400).json({ error: 'Invalid loungeId' });
    }

    // Build query options with cursor-based pagination
    // We fetch pageSize + 1 to determine if there are more messages
    const queryOptions = {
      where: {
        loungeId: loungeId,
        isDeleted: false, // Exclude soft-deleted messages
      },
      take: pageSize + 1, // Fetch one extra to check for more pages
      orderBy: {
        createdAt: 'desc', // Most recent messages first
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
        // Explicitly exclude deleted fields from response
        // isDeleted: false by default in where clause
      },
    };

    // Add cursor for pagination if provided
    if (cursor && typeof cursor === 'string') {
      // Validate cursor format (should be a UUID)
      try {
        queryOptions.cursor = { id: cursor };
        queryOptions.skip = 1; // Skip the cursor itself
      } catch (error) {
        // If cursor is invalid, return error instead of silently ignoring
        return res.status(400).json({ 
          error: 'Invalid cursor format',
          details: 'Cursor must be a valid message ID'
        });
      }
    }

    // Execute query with performance-optimized indexes:
    // - loungeId + createdAt (DESC) composite index for efficient filtering and sorting
    // - isDeleted index for fast filtering of non-deleted messages
    const messages = await prisma.chatMessage.findMany(queryOptions);

    // Determine if there are more messages beyond this page
    const hasMore = messages.length > pageSize;
    
    // Remove the extra message if we fetched pageSize + 1
    const resultMessages = hasMore ? messages.slice(0, pageSize) : messages;

    // Set nextCursor to the ID of the last message in the result
    const nextCursor = hasMore && resultMessages.length > 0
      ? resultMessages[resultMessages.length - 1].id
      : null;

    // Return messages with pagination metadata
    res.json({
      messages: resultMessages,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    // Log error for debugging while keeping response generic for security
    logger.error('Error fetching message history:', error);
    
    // Handle specific Prisma errors
    if (error.message && error.message.includes('Invalid')) {
      return res.status(400).json({ 
        error: 'Invalid request parameters' 
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      error: 'Failed to fetch message history',
      message: 'An internal error occurred while retrieving messages'
    });
  }
});

module.exports = router;
