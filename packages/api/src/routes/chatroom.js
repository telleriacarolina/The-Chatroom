const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticateRequest } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

// Get all lounges (public endpoint)
router.get('/lounges', async (req, res) => {
  try {
    const lounges = await prisma.lounge.findMany({
      where: { isActive: true },
      include: {
        languageRooms: {
          where: { isActive: true }
        }
      }
    });
    res.json(lounges);
  } catch (error) {
    logger.error('Error fetching lounges:', error);
    res.status(500).json({ error: 'Failed to fetch lounges' });
  }
});

// Get language rooms for a lounge (requires authentication)
router.get('/lounges/:loungeId/rooms', apiLimiter, authenticateRequest, async (req, res) => {
  try {
    const { loungeId } = req.params;
    const rooms = await prisma.languageRoom.findMany({
      where: { 
        loungeId,
        isActive: true 
      }
    });
    res.json(rooms);
  } catch (error) {
    logger.error('Error fetching language rooms:', error);
    res.status(500).json({ error: 'Failed to fetch language rooms' });
  }
});

// Get chat messages for a language room (requires authentication)
router.get('/rooms/:roomId/messages', apiLimiter, authenticateRequest, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    
    const messages = await prisma.chatMessage.findMany({
      where: {
        languageRoomId: roomId,
        isDeleted: false,
        moderationStatus: 'APPROVED'
      },
      take: parseInt(limit),
      ...(before && { 
        cursor: { id: before },
        skip: 1
      }),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            permanentUsername: true,
            avatarUrl: true
          }
        }
      }
    });
    
    res.json(messages.reverse());
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
