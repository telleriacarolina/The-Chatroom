#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { generateCSRFToken, validateCSRFToken } = require('../packages/api/src/utils/security');

function testCsrfTokenGeneration() {
  const tokenA = generateCSRFToken();
  const tokenB = generateCSRFToken();

  assert.strictEqual(typeof tokenA, 'string');
  assert.strictEqual(tokenA.length, 64, 'CSRF token must be a 64-char hex string');
  assert.notStrictEqual(tokenA, tokenB, 'CSRF tokens must be unique across calls');
  assert.strictEqual(validateCSRFToken(tokenA, tokenA), true, 'CSRF validator must accept matching tokens');
  assert.strictEqual(validateCSRFToken(tokenA, tokenB), false, 'CSRF validator must reject mismatched tokens');
}

function testMarketplaceSchemaContract() {
  const schemaPath = path.resolve(__dirname, '../packages/shared/src/schemas/marketplaceItem.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  assert.strictEqual(schema.title, 'MarketplaceItem');
  assert.strictEqual(schema.type, 'object');
  assert.ok(Array.isArray(schema.required), 'Marketplace schema must define required fields');
  assert.ok(schema.required.includes('sellerId'), 'Marketplace schema must require sellerId');
  assert.ok(schema.required.includes('price'), 'Marketplace schema must require price');
  assert.ok(schema.required.includes('accessLevel'), 'Marketplace schema must require accessLevel');
}

function testMarketplaceModerationActionExists() {
  const moderationRoutePath = path.resolve(__dirname, '../packages/api/src/routes/moderation.js');
  const moderationSource = fs.readFileSync(moderationRoutePath, 'utf8');
  assert.ok(
    moderationSource.includes("actionType === 'ITEM_REMOVE'"),
    'Moderation route must support ITEM_REMOVE action'
  );
  assert.ok(
    moderationSource.includes("status: 'REMOVED'"),
    'Marketplace ITEM_REMOVE action must set item status to REMOVED'
  );
}

function main() {
  testCsrfTokenGeneration();
  testMarketplaceSchemaContract();
  testMarketplaceModerationActionExists();
  console.log('CSRF and marketplace regression checks passed.');
}

main();
