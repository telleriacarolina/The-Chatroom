const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { createMarketplaceRoutes } = require('../packages/api/src/routes/marketplace');

function buildMockPrisma() {
  const listings = new Map();
  const transactions = new Map();

  const prisma = {
    marketplaceItem: {
      findMany: async ({ where, skip, take }) => {
        const items = [...listings.values()].filter((item) => item.status === (where?.status || item.status));
        return items.slice(skip || 0, (skip || 0) + (take || items.length));
      },
      count: async ({ where }) => {
        const items = [...listings.values()].filter((item) => item.status === (where?.status || item.status));
        return items.length;
      },
      findUnique: async ({ where }) => listings.get(where.id) || null,
      create: async ({ data }) => {
        const item = {
          id: `item_${Math.random().toString(36).slice(2, 9)}`,
          sellerId: data.sellerId,
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency,
          category: data.category,
          contentType: data.contentType,
          thumbnailUrl: data.thumbnailUrl,
          previewUrls: data.previewUrls || [],
          accessLevel: data.accessLevel,
          status: data.status,
          viewCount: 0,
          purchaseCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          seller: {
            id: data.sellerId,
            permanentUsername: 'seller',
            preferredName: 'Seller',
            avatarUrl: null,
          },
        };
        listings.set(item.id, item);
        return item;
      },
      update: async ({ where, data }) => {
        const item = listings.get(where.id);
        if (!item) throw new Error('not found');
        const next = { ...item, ...data, updatedAt: new Date().toISOString() };
        listings.set(where.id, next);
        return next;
      },
    },
    transaction: {
      findMany: async () => [...transactions.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      count: async ({ where }) => [...transactions.values()].filter((tx) => tx.sellerId === where.sellerId && tx.paymentStatus === where.paymentStatus).length,
      aggregate: async ({ where }) => ({
        _sum: {
          sellerPayout: [...transactions.values()].filter((tx) => tx.sellerId === where.sellerId && tx.paymentStatus === where.paymentStatus).reduce((sum, tx) => sum + Number(tx.sellerPayout || 0), 0),
        },
      }),
      findFirst: async ({ where }) => {
        const matches = [...transactions.values()].find((tx) => {
          if (where.paymentIntentId && where.buyerId) {
            return tx.paymentIntentId === where.paymentIntentId && tx.buyerId === where.buyerId;
          }
          if (where.itemId && where.buyerId && where.paymentStatus) {
            return tx.itemId === where.itemId && tx.buyerId === where.buyerId && tx.paymentStatus === where.paymentStatus;
          }
          return false;
        });
        return matches || null;
      },
      create: async ({ data }) => {
        const tx = {
          id: `tx_${Math.random().toString(36).slice(2, 9)}`,
          buyerId: data.buyerId,
          sellerId: data.sellerId,
          itemId: data.itemId,
          amount: data.amount,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          transactionFee: data.transactionFee,
          sellerPayout: data.sellerPayout,
          paymentIntentId: data.paymentIntentId,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        transactions.set(tx.id, tx);
        return tx;
      },
      findUnique: async ({ where }) => transactions.get(where.id) || null,
      update: async ({ where, data }) => {
        const tx = transactions.get(where.id);
        if (!tx) throw new Error('not found');
        const next = { ...tx, ...data, completedAt: data.completedAt || tx.completedAt };
        transactions.set(where.id, next);
        return next;
      },
    },
    $transaction: async (callback) => callback({
      transaction: {
        findUnique: async ({ where }) => transactions.get(where.id) || null,
        update: async ({ where, data }) => {
          const tx = transactions.get(where.id);
          if (!tx) throw new Error('not found');
          const next = { ...tx, ...data };
          transactions.set(where.id, next);
          return next;
        },
      },
      marketplaceItem: {
        update: async ({ where, data }) => {
          const item = listings.get(where.id);
          if (!item) throw new Error('not found');
          const next = { ...item, ...data };
          listings.set(where.id, next);
          return next;
        },
      },
    }),
  };

  return { prisma, listings, transactions };
}

async function run() {
  const { prisma, listings } = buildMockPrisma();
  const app = express();
  app.use(express.json());
  app.use('/api/marketplace', createMarketplaceRoutes({ prismaClient: prisma, authMiddleware: (req, res, next) => {
    req.userId = req.headers['x-user-id'] || 'user-1';
    next();
  }, loggerInstance: { error: () => {} } }));

  const listPayload = {
    title: 'Test item',
    description: 'A valid marketplace item description',
    price: 25,
    currency: 'USD',
    category: 'PHOTOS',
    contentType: 'SFW',
    thumbnailUrl: 'https://example.com/thumb.png',
    previewUrls: ['https://example.com/preview.png'],
    accessLevel: 'MAIN_LOUNGE',
  };

  const createRes = await request(app)
    .post('/api/marketplace/items')
    .set('x-user-id', 'seller-1')
    .send(listPayload)
    .expect(201);

  assert.equal(createRes.body.sellerId, 'seller-1');
  assert.equal(createRes.body.status, 'ACTIVE');

  const createdId = createRes.body.id;
  const listRes = await request(app)
    .get('/api/marketplace/items')
    .expect(200);
  assert.ok(Array.isArray(listRes.body.items));
  assert.ok(listRes.body.items.some((item) => item.id === createdId));

  const patchRes = await request(app)
    .patch(`/api/marketplace/items/${createdId}`)
    .set('x-user-id', 'other-user')
    .send({ title: 'Attempted override' })
    .expect(403);
  assert.match(patchRes.body.error, /only update your own/i);

  const creatorStatsRes = await request(app)
    .get('/api/marketplace/creator/stats')
    .set('x-user-id', 'seller-1')
    .expect(200);
  assert.equal(creatorStatsRes.body.totalItems, 1);
  assert.equal(creatorStatsRes.body.activeItems, 1);

  const purchaseRes = await request(app)
    .post('/api/marketplace/purchase')
    .set('x-user-id', 'buyer-1')
    .send({ itemId: createdId, paymentMethod: 'STRIPE' })
    .expect(201);
  assert.equal(purchaseRes.body.transaction.paymentStatus, 'PENDING');

  const confirmRes = await request(app)
    .post(`/api/marketplace/payments/${purchaseRes.body.paymentIntentId}/confirm`)
    .set('x-user-id', 'buyer-1')
    .expect(200);
  assert.equal(confirmRes.body.status, 'COMPLETED');
  assert.equal(confirmRes.body.transaction.paymentStatus, 'COMPLETED');

  const itemAfterPurchase = listings.get(createdId);
  assert.equal(itemAfterPurchase.status, 'SOLD');

  console.log('Marketplace route tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
