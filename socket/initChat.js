"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChat = void 0;
const prisma = require("./lib/prisma");
const logger = require("./lib/logger");
/**
 * Socket connection tracking for presence management
 * Maps userId to array of socket IDs (for multiple device/tab support)
 */
const userSockets = new Map();
/**
 * Initialize chat handlers for Socket.IO server
 * Implements:
 * - Real-time presence tracking (online/offline)
 * - Message creation, editing, and deletion
 * - Read receipts
 * - Typing indicators
 * - Reconnection handling
 */
const initChat = (io) => {
    io.on("connection", (socket) => {
        logger.info(`User connected: ${socket.id}`);
        /**
         * Handle user joining a lounge
         * Updates presence status and broadcasts user list
         */
        socket.on("join-lounge", async ({ loungeId, userId }) => {
            try {
                // Join the Socket.IO room
                socket.join(loungeId);
                // Track this socket for the user
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId)?.add(socket.id);
                // Store userId on socket for later use
                socket.data.userId = userId;
                socket.data.loungeId = loungeId;
                // Update user's online status in database
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isOnline: true,
                        lastSeenAt: new Date()
                    }
                });
                // Get all active users in the lounge
                // We need to find all sessions/temp sessions currently in this lounge
                const sessions = await prisma.session.findMany({
                    where: {
                        isActive: true,
                        user: {
                            isOnline: true
                        }
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                permanentUsername: true,
                                preferredName: true,
                                avatarUrl: true,
                                isOnline: true,
                                lastSeenAt: true
                            }
                        }
                    }
                });
                const tempSessions = await prisma.tempSession.findMany({
                    where: {
                        expiresAt: {
                            gt: new Date()
                        }
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                isOnline: true,
                                lastSeenAt: true
                            }
                        }
                    }
                });
                // Combine and broadcast user list to the lounge
                const onlineUsers = sessions
                    .filter(s => s.user.isOnline)
                    .map(s => ({
                    id: s.user.id,
                    username: s.user.permanentUsername || s.user.preferredName,
                    avatarUrl: s.user.avatarUrl,
                    isOnline: s.user.isOnline,
                    lastSeenAt: s.user.lastSeenAt
                }));
                io.to(loungeId).emit("user-list", onlineUsers);
                // Notify others that this user joined
                socket.to(loungeId).emit("user-joined", {
                    userId,
                    timestamp: new Date()
                });
                logger.info(`User ${userId} joined lounge ${loungeId}`);
            }
            catch (error) {
                logger.error("Error in join-lounge:", error);
                socket.emit("error", { message: "Failed to join lounge" });
            }
        });
        /**
         * Handle typing indicator
         * Broadcasts typing status to other users in the lounge
         */
        socket.on("typing", ({ loungeId, userId, isTyping }) => {
            try {
                socket.to(loungeId).emit("user-typing", {
                    userId,
                    isTyping,
                    timestamp: new Date()
                });
                logger.debug(`User ${userId} typing status: ${isTyping}`);
            }
            catch (error) {
                logger.error("Error in typing:", error);
            }
        });
        /**
         * Handle new message creation
         * Stores message in DB and broadcasts to lounge members
         */
        socket.on("message", async ({ loungeId, languageRoomId, userId, content, displayUsername, messageType = "TEXT" }) => {
            try {
                // Validate messageType
                const validMessageTypes = ["TEXT", "IMAGE", "VIDEO", "LINK", "SYSTEM"];
                const validatedMessageType = validMessageTypes.includes(messageType) ? messageType : "TEXT";
                // Create message in database
                const message = await prisma.chatMessage.create({
                    data: {
                        loungeId,
                        languageRoomId,
                        userId,
                        displayUsername,
                        messageText: content,
                        messageType: validatedMessageType,
                        moderationStatus: "APPROVED"
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                permanentUsername: true,
                                preferredName: true,
                                avatarUrl: true
                            }
                        }
                    }
                });
                // Broadcast message to all users in the lounge
                io.to(loungeId).emit("message", {
                    id: message.id,
                    loungeId: message.loungeId,
                    languageRoomId: message.languageRoomId,
                    userId: message.userId,
                    displayUsername: message.displayUsername,
                    content: message.messageText,
                    messageType: message.messageType,
                    isEdited: message.isEdited,
                    isDeleted: message.isDeleted,
                    createdAt: message.createdAt,
                    user: message.user
                });
                logger.info(`Message ${message.id} created by user ${userId} in lounge ${loungeId}`);
            }
            catch (error) {
                logger.error("Error in message creation:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });
        /**
         * Handle message editing
         * Updates message in DB and broadcasts the edit to lounge members
         */
        socket.on("edit-message", async ({ messageId, userId, newContent, loungeId }) => {
            try {
                // Verify the user owns the message
                const existingMessage = await prisma.chatMessage.findUnique({
                    where: { id: messageId }
                });
                if (!existingMessage) {
                    socket.emit("error", { message: "Message not found" });
                    return;
                }
                if (existingMessage.userId !== userId) {
                    socket.emit("error", { message: "Not authorized to edit this message" });
                    return;
                }
                // Update message
                const updatedMessage = await prisma.chatMessage.update({
                    where: { id: messageId },
                    data: {
                        messageText: newContent,
                        isEdited: true,
                        editedAt: new Date()
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                permanentUsername: true,
                                preferredName: true,
                                avatarUrl: true
                            }
                        }
                    }
                });
                // Broadcast the edited message to all users in the lounge
                io.to(loungeId).emit("message-edited", {
                    id: updatedMessage.id,
                    content: updatedMessage.messageText,
                    isEdited: updatedMessage.isEdited,
                    editedAt: updatedMessage.editedAt,
                    userId: updatedMessage.userId
                });
                logger.info(`Message ${messageId} edited by user ${userId}`);
            }
            catch (error) {
                logger.error("Error in edit-message:", error);
                socket.emit("error", { message: "Failed to edit message" });
            }
        });
        /**
         * Handle message deletion
         * Marks message as deleted in DB and broadcasts the deletion
         */
        socket.on("delete-message", async ({ messageId, userId, loungeId }) => {
            try {
                // Verify the user owns the message or is a moderator
                const existingMessage = await prisma.chatMessage.findUnique({
                    where: { id: messageId }
                });
                if (!existingMessage) {
                    socket.emit("error", { message: "Message not found" });
                    return;
                }
                // Check if user is the owner (for now, skip moderator check for simplicity)
                if (existingMessage.userId !== userId) {
                    socket.emit("error", { message: "Not authorized to delete this message" });
                    return;
                }
                // Soft delete the message
                const deletedMessage = await prisma.chatMessage.update({
                    where: { id: messageId },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedById: userId
                    }
                });
                // Broadcast the deletion to all users in the lounge
                io.to(loungeId).emit("message-deleted", {
                    id: deletedMessage.id,
                    userId: deletedMessage.userId,
                    deletedAt: deletedMessage.deletedAt,
                    deletedById: deletedMessage.deletedById
                });
                logger.info(`Message ${messageId} deleted by user ${userId}`);
            }
            catch (error) {
                logger.error("Error in delete-message:", error);
                socket.emit("error", { message: "Failed to delete message" });
            }
        });
        /**
         * Handle read receipt
         * Records when a user has read a message
         */
        socket.on("mark-read", async ({ messageId, userId }) => {
            try {
                // Create or update read receipt
                const readReceipt = await prisma.messageRead.upsert({
                    where: {
                        messageId_userId: {
                            messageId,
                            userId
                        }
                    },
                    update: {
                        readAt: new Date()
                    },
                    create: {
                        messageId,
                        userId,
                        readAt: new Date()
                    }
                });
                // Get the message to know which lounge to broadcast to
                const message = await prisma.chatMessage.findUnique({
                    where: { id: messageId },
                    select: { loungeId: true, userId: true }
                });
                if (message) {
                    // Notify the message sender that their message was read
                    io.to(message.loungeId).emit("message-read", {
                        messageId,
                        userId,
                        readAt: readReceipt.readAt
                    });
                }
                logger.debug(`Message ${messageId} marked as read by user ${userId}`);
            }
            catch (error) {
                logger.error("Error in mark-read:", error);
                socket.emit("error", { message: "Failed to mark message as read" });
            }
        });
        /**
         * Handle bulk read receipts
         * Marks multiple messages as read at once
         */
        socket.on("mark-multiple-read", async ({ messageIds, userId }) => {
            try {
                const readAt = new Date();
                // Create read receipts for all messages
                const readReceipts = await Promise.all(messageIds.map(messageId => prisma.messageRead.upsert({
                    where: {
                        messageId_userId: {
                            messageId,
                            userId
                        }
                    },
                    update: { readAt },
                    create: {
                        messageId,
                        userId,
                        readAt
                    }
                })));
                // Get the lounges for these messages
                const messages = await prisma.chatMessage.findMany({
                    where: { id: { in: messageIds } },
                    select: { id: true, loungeId: true }
                });
                // Broadcast read receipts to relevant lounges
                const loungeIds = [...new Set(messages.map(m => m.loungeId))];
                loungeIds.forEach((loungeId) => {
                    io.to(loungeId).emit("messages-read", {
                        messageIds,
                        userId,
                        readAt
                    });
                });
                logger.debug(`${messageIds.length} messages marked as read by user ${userId}`);
            }
            catch (error) {
                logger.error("Error in mark-multiple-read:", error);
                socket.emit("error", { message: "Failed to mark messages as read" });
            }
        });
        /**
         * Handle reconnection
         * Restores user's presence and lounge memberships
         */
        socket.on("reconnect", async ({ userId, loungeIds }) => {
            try {
                // Rejoin all lounges
                loungeIds.forEach(loungeId => {
                    socket.join(loungeId);
                });
                // Update presence
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId)?.add(socket.id);
                socket.data.userId = userId;
                // Update online status
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isOnline: true,
                        lastSeenAt: new Date()
                    }
                });
                // Notify all lounges of reconnection
                loungeIds.forEach(loungeId => {
                    socket.to(loungeId).emit("user-reconnected", {
                        userId,
                        timestamp: new Date()
                    });
                });
                logger.info(`User ${userId} reconnected to ${loungeIds.length} lounges`);
            }
            catch (error) {
                logger.error("Error in reconnect:", error);
                socket.emit("error", { message: "Failed to reconnect" });
            }
        });
        /**
         * Handle disconnection
         * Updates presence status when user disconnects
         */
        socket.on("disconnect", async () => {
            try {
                const userId = socket.data.userId;
                const loungeId = socket.data.loungeId;
                if (!userId) {
                    logger.info(`Socket ${socket.id} disconnected (no userId)`);
                    return;
                }
                // Remove this socket from user's socket set
                const userSocketSet = userSockets.get(userId);
                if (userSocketSet) {
                    userSocketSet.delete(socket.id);
                    // If user has no more active sockets, mark as offline
                    if (userSocketSet.size === 0) {
                        userSockets.delete(userId);
                        // Update user's online status in database
                        await prisma.user.update({
                            where: { id: userId },
                            data: {
                                isOnline: false,
                                lastSeenAt: new Date()
                            }
                        });
                        // Notify the lounge that user went offline
                        if (loungeId) {
                            io.to(loungeId).emit("user-left", {
                                userId,
                                timestamp: new Date()
                            });
                        }
                        logger.info(`User ${userId} went offline`);
                    }
                    else {
                        logger.info(`User ${userId} still has ${userSocketSet.size} active connection(s)`);
                    }
                }
                logger.info(`Socket ${socket.id} disconnected`);
            }
            catch (error) {
                logger.error("Error in disconnect handler:", error);
            }
        });
        /**
         * Handle explicit leave lounge event
         */
        socket.on("leave-lounge", async ({ loungeId, userId }) => {
            try {
                socket.leave(loungeId);
                // Notify others in the lounge
                socket.to(loungeId).emit("user-left", {
                    userId,
                    timestamp: new Date()
                });
                logger.info(`User ${userId} left lounge ${loungeId}`);
            }
            catch (error) {
                logger.error("Error in leave-lounge:", error);
            }
        });
        /**
         * Get read receipts for a specific message
         */
        socket.on("get-message-reads", async ({ messageId }) => {
            try {
                const reads = await prisma.messageRead.findMany({
                    where: { messageId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                permanentUsername: true,
                                preferredName: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: {
                        readAt: 'asc'
                    }
                });
                socket.emit("message-reads", {
                    messageId,
                    reads: reads.map(r => ({
                        userId: r.userId,
                        readAt: r.readAt,
                        user: r.user
                    }))
                });
                logger.debug(`Retrieved ${reads.length} read receipts for message ${messageId}`);
            }
            catch (error) {
                logger.error("Error in get-message-reads:", error);
                socket.emit("error", { message: "Failed to get read receipts" });
            }
        });
    });
    // Periodic cleanup of stale connections (every 5 minutes)
    setInterval(async () => {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            // Find users marked as online but haven't been seen recently
            const staleUsers = await prisma.user.findMany({
                where: {
                    isOnline: true,
                    lastSeenAt: {
                        lt: fiveMinutesAgo
                    }
                }
            });
            if (staleUsers.length > 0) {
                // Mark them as offline if they're not in our active socket map
                const usersToMarkOffline = staleUsers.filter(user => !userSockets.has(user.id));
                if (usersToMarkOffline.length > 0) {
                    await prisma.user.updateMany({
                        where: {
                            id: {
                                in: usersToMarkOffline.map(u => u.id)
                            }
                        },
                        data: {
                            isOnline: false
                        }
                    });
                    logger.info(`Marked ${usersToMarkOffline.length} stale users as offline`);
                }
            }
        }
        catch (error) {
            logger.error("Error in cleanup interval:", error);
        }
    }, 5 * 60 * 1000);
    logger.info("Chat system initialized with presence tracking and message management");
};
exports.initChat = initChat;
