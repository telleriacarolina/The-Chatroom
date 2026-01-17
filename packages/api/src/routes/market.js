// Marketplace routes - Payment integration and content management
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const multer = require('multer');
const path = require('path');

// Simple logger (fallback if the main logger has issues)
const logger = {
  info: (...args) => console.log('[INFO]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  debug: (...args) => {
    if (process.env.DEBUG) console.log('[DEBUG]', new Date().toISOString(), ...args);
  }
};

// Stripe initialization (will be loaded when STRIPE_SECRET_KEY is available)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// AWS S3 initialization (optional, will be used if credentials are available)
let s3Client = null;
let uploadToS3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  
  // Helper function to upload files to S3
  uploadToS3 = async (file, folder = 'marketplace') => {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    
    await s3Client.send(command);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  };
}

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'application/pdf', 'application/zip',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

// Simple auth middleware (replace with your actual auth middleware)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // TODO: Verify JWT token and extract user ID
  // For now, we'll extract a mock user ID
  // In production, this should verify the JWT and set req.userId
  const token = authHeader.substring(7);
  
  // Mock: Extract userId from token (in production, verify JWT)
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret');
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Platform fee percentage (10%)
const PLATFORM_FEE_PERCENTAGE = 0.10;

/**
 * Calculate platform fee and creator payout
 * @param {number} amount - Total transaction amount
 * @returns {Object} - { platformFee, creatorPayout }
 */
function calculateFees(amount) {
  const platformFee = parseFloat((amount * PLATFORM_FEE_PERCENTAGE).toFixed(2));
  const creatorPayout = parseFloat((amount - platformFee).toFixed(2));
  return { platformFee, creatorPayout };
}

/* ==================== CONTENT UPLOAD ==================== */

/**
 * POST /api/market/content
 * Upload marketplace content with file storage
 * Body: multipart/form-data with file, thumbnail, title, description, price, category, contentType, accessLevel
 */
router.post('/content', authenticate, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, price, category, contentType, accessLevel, currency = 'USD' } = req.body;
    
    // Validation
    if (!title || !description || !price || !category || !contentType || !accessLevel) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, price, category, contentType, accessLevel' 
      });
    }
    
    if (!req.files || !req.files.file || !req.files.thumbnail) {
      return res.status(400).json({ error: 'Both file and thumbnail are required' });
    }
    
    const file = req.files.file[0];
    const thumbnail = req.files.thumbnail[0];
    
    // Upload to S3 if available, otherwise store locally
    let fileUrl, thumbnailUrl;
    
    if (uploadToS3) {
      try {
        fileUrl = await uploadToS3(file, 'marketplace/files');
        thumbnailUrl = await uploadToS3(thumbnail, 'marketplace/thumbnails');
        logger.info(`Files uploaded to S3: ${fileUrl}`);
      } catch (s3Error) {
        logger.error('S3 upload failed:', s3Error);
        return res.status(500).json({ error: 'File upload failed' });
      }
    } else {
      // Fallback: Store file paths (in production, save to local disk)
      fileUrl = `/uploads/marketplace/files/${Date.now()}-${file.originalname}`;
      thumbnailUrl = `/uploads/marketplace/thumbnails/${Date.now()}-${thumbnail.originalname}`;
      logger.warn('S3 not configured, using local file paths');
    }
    
    // Create marketplace item in database
    const item = await prisma.marketplaceItem.create({
      data: {
        sellerId: req.userId,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        currency: currency,
        category: category,
        contentType: contentType,
        fileUrl: fileUrl,
        thumbnailUrl: thumbnailUrl,
        accessLevel: accessLevel,
        status: 'ACTIVE',
      },
    });
    
    logger.info(`Marketplace item created: ${item.id} by user ${req.userId}`);
    
    res.status(201).json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        status: item.status,
        createdAt: item.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating marketplace item:', error);
    res.status(500).json({ error: 'Failed to create marketplace item' });
  }
});

/* ==================== PURCHASE / PAYMENT ==================== */

/**
 * POST /api/market/purchase
 * Initiate a purchase with payment processing
 * Body: { itemId, paymentMethod }
 */
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { itemId, paymentMethod = 'STRIPE' } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }
    
    // Fetch the marketplace item
    const item = await prisma.marketplaceItem.findUnique({
      where: { id: itemId },
      include: { seller: true },
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Item is not available for purchase' });
    }
    
    // Prevent self-purchase
    if (item.sellerId === req.userId) {
      return res.status(400).json({ error: 'Cannot purchase your own item' });
    }
    
    // Calculate fees
    const amount = parseFloat(item.price);
    const { platformFee, creatorPayout } = calculateFees(amount);
    
    // Create transaction record with PENDING status
    const transaction = await prisma.transaction.create({
      data: {
        itemId: item.id,
        buyerId: req.userId,
        sellerId: item.sellerId,
        amount: amount,
        currency: item.currency,
        paymentMethod: paymentMethod,
        paymentStatus: 'PENDING',
        transactionFee: platformFee,
        sellerPayout: creatorPayout,
      },
    });
    
    logger.info(`Transaction created: ${transaction.id} for item ${itemId}`);
    
    // Process payment based on payment method
    let paymentIntent = null;
    
    if (paymentMethod === 'STRIPE' && stripe) {
      try {
        // Create Stripe payment intent
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Stripe uses cents
          currency: item.currency.toLowerCase(),
          metadata: {
            transactionId: transaction.id,
            itemId: item.id,
            buyerId: req.userId,
            sellerId: item.sellerId,
          },
        });
        
        // Update transaction with payment intent ID
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { paymentIntentId: paymentIntent.id },
        });
        
        logger.info(`Stripe payment intent created: ${paymentIntent.id}`);
        
        res.json({
          success: true,
          transaction: {
            id: transaction.id,
            status: transaction.paymentStatus,
            amount: transaction.amount,
            currency: transaction.currency,
            platformFee: transaction.transactionFee,
            creatorPayout: transaction.sellerPayout,
          },
          paymentIntent: {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          },
        });
      } catch (stripeError) {
        logger.error('Stripe payment failed:', stripeError);
        
        // Update transaction to FAILED
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus: 'FAILED' },
        });
        
        return res.status(500).json({ error: 'Payment processing failed' });
      }
    } else if (paymentMethod === 'PAYPAL') {
      // TODO: Implement PayPal integration
      logger.warn('PayPal integration not yet implemented');
      return res.status(501).json({ error: 'PayPal integration coming soon' });
    } else {
      // No payment processor configured
      logger.warn('No payment processor configured, marking transaction as PENDING');
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          status: transaction.paymentStatus,
          amount: transaction.amount,
          currency: transaction.currency,
          platformFee: transaction.transactionFee,
          creatorPayout: transaction.sellerPayout,
        },
        message: 'Payment processor not configured. Transaction pending manual approval.',
      });
    }
  } catch (error) {
    logger.error('Error processing purchase:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

/* ==================== STRIPE WEBHOOK ==================== */

/**
 * POST /api/market/webhook/stripe
 * Handle Stripe webhook events (payment success, failure, refund)
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn('Stripe webhook called but not configured');
    return res.status(400).json({ error: 'Stripe not configured' });
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  logger.info(`Stripe webhook received: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update transaction to COMPLETED
        const transaction = await prisma.transaction.findFirst({
          where: { paymentIntentId: paymentIntent.id },
        });
        
        if (transaction) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              paymentStatus: 'COMPLETED',
              completedAt: new Date(),
            },
          });
          
          // Increment purchase count on item
          await prisma.marketplaceItem.update({
            where: { id: transaction.itemId },
            data: { purchaseCount: { increment: 1 } },
          });
          
          logger.info(`Transaction ${transaction.id} completed successfully`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        
        // Update transaction to FAILED
        const failedTransaction = await prisma.transaction.findFirst({
          where: { paymentIntentId: failedIntent.id },
        });
        
        if (failedTransaction) {
          await prisma.transaction.update({
            where: { id: failedTransaction.id },
            data: { paymentStatus: 'FAILED' },
          });
          
          logger.info(`Transaction ${failedTransaction.id} failed`);
        }
        break;
        
      case 'charge.refunded':
        const refund = event.data.object;
        
        // Update transaction to REFUNDED
        const refundTransaction = await prisma.transaction.findFirst({
          where: { paymentIntentId: refund.payment_intent },
        });
        
        if (refundTransaction) {
          await prisma.transaction.update({
            where: { id: refundTransaction.id },
            data: { paymentStatus: 'REFUNDED' },
          });
          
          // Decrement purchase count
          await prisma.marketplaceItem.update({
            where: { id: refundTransaction.itemId },
            data: { purchaseCount: { decrement: 1 } },
          });
          
          logger.info(`Transaction ${refundTransaction.id} refunded`);
        }
        break;
        
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/* ==================== CREATOR DASHBOARD ==================== */

/**
 * GET /api/market/creator/stats
 * Get creator statistics (total sales, revenue, items)
 */
router.get('/creator/stats', authenticate, async (req, res) => {
  try {
    // Get total items created by this user
    const totalItems = await prisma.marketplaceItem.count({
      where: { sellerId: req.userId },
    });
    
    // Get active items
    const activeItems = await prisma.marketplaceItem.count({
      where: { 
        sellerId: req.userId,
        status: 'ACTIVE',
      },
    });
    
    // Get completed transactions
    const completedTransactions = await prisma.transaction.findMany({
      where: {
        sellerId: req.userId,
        paymentStatus: 'COMPLETED',
      },
      select: {
        amount: true,
        transactionFee: true,
        sellerPayout: true,
      },
    });
    
    // Calculate totals
    const totalSales = completedTransactions.length;
    const totalRevenue = completedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalPayout = completedTransactions.reduce((sum, tx) => sum + parseFloat(tx.sellerPayout || 0), 0);
    const totalFees = completedTransactions.reduce((sum, tx) => sum + parseFloat(tx.transactionFee || 0), 0);
    
    res.json({
      success: true,
      stats: {
        totalItems,
        activeItems,
        totalSales,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalPayout: parseFloat(totalPayout.toFixed(2)),
        totalFees: parseFloat(totalFees.toFixed(2)),
      },
    });
  } catch (error) {
    logger.error('Error fetching creator stats:', error);
    res.status(500).json({ error: 'Failed to fetch creator stats' });
  }
});

/**
 * GET /api/market/creator/sales
 * Get detailed sales history for creator
 * Query params: page, limit
 */
router.get('/creator/sales', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get transactions for this seller
    const transactions = await prisma.transaction.findMany({
      where: { sellerId: req.userId },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            category: true,
          },
        },
        buyer: {
          select: {
            id: true,
            permanentUsername: true,
            preferredName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: { sellerId: req.userId },
    });
    
    res.json({
      success: true,
      sales: transactions.map(tx => ({
        id: tx.id,
        item: tx.item,
        buyer: tx.buyer,
        amount: tx.amount,
        currency: tx.currency,
        platformFee: tx.transactionFee,
        payout: tx.sellerPayout,
        status: tx.paymentStatus,
        createdAt: tx.createdAt,
        completedAt: tx.completedAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching creator sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
});

/**
 * GET /api/market/creator/items
 * Get all items created by this seller
 * Query params: status, page, limit
 */
router.get('/creator/items', authenticate, async (req, res) => {
  try {
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const where = { sellerId: req.userId };
    if (status) {
      where.status = status;
    }
    
    const items = await prisma.marketplaceItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    
    const totalCount = await prisma.marketplaceItem.count({ where });
    
    res.json({
      success: true,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        status: item.status,
        viewCount: item.viewCount,
        purchaseCount: item.purchaseCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching creator items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/* ==================== MARKETPLACE BROWSING ==================== */

/**
 * GET /api/market/items
 * Browse marketplace items
 * Query params: category, contentType, accessLevel, page, limit, sort
 */
router.get('/items', async (req, res) => {
  try {
    const { category, contentType, accessLevel, sort = 'createdAt', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { status: 'ACTIVE' };
    if (category) where.category = category;
    if (contentType) where.contentType = contentType;
    if (accessLevel) where.accessLevel = accessLevel;
    
    const orderBy = {};
    if (sort === 'price_asc') orderBy.price = 'asc';
    else if (sort === 'price_desc') orderBy.price = 'desc';
    else if (sort === 'popular') orderBy.purchaseCount = 'desc';
    else orderBy.createdAt = 'desc';
    
    const items = await prisma.marketplaceItem.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            permanentUsername: true,
            preferredName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy,
      skip,
      take: parseInt(limit),
    });
    
    const totalCount = await prisma.marketplaceItem.count({ where });
    
    res.json({
      success: true,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        seller: item.seller,
        viewCount: item.viewCount,
        purchaseCount: item.purchaseCount,
        createdAt: item.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching marketplace items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

/**
 * GET /api/market/items/:id
 * Get detailed item information
 */
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.marketplaceItem.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            permanentUsername: true,
            preferredName: true,
            avatarUrl: true,
          },
        },
      },
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Increment view count
    await prisma.marketplaceItem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    
    res.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
        contentType: item.contentType,
        thumbnailUrl: item.thumbnailUrl,
        accessLevel: item.accessLevel,
        status: item.status,
        seller: item.seller,
        viewCount: item.viewCount + 1,
        purchaseCount: item.purchaseCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching item details:', error);
    res.status(500).json({ error: 'Failed to fetch item details' });
  }
});

module.exports = router;
