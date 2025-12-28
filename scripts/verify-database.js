#!/usr/bin/env node
/**
 * Database Verification Script
 * 
 * This script verifies that the database is properly initialized
 * and all tables are accessible via Prisma.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TABLES = [
  'user',
  'session',
  'tempSession',
  'lounge',
  'languageRoom',
  'chatMessage',
  'marketplaceItem',
  'transaction',
  'moderationAction',
  'userReport',
  'iDVerification',
  'auditLog'
];

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  let allPassed = true;

  try {
    // Test connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database\n');

    // Verify each table
    console.log('2. Verifying tables:');
    for (const table of TABLES) {
      try {
        const count = await prisma[table].count();
        console.log(`   ✅ ${table} - OK (${count} records)`);
      } catch (error) {
        console.log(`   ❌ ${table} - FAILED: ${error.message}`);
        allPassed = false;
      }
    }
    console.log('');

    // Test enum values
    console.log('3. Testing enum values...');
    try {
      const testSession = await prisma.tempSession.create({
        data: {
          temporaryUsername: 'verify_test_' + Date.now(),
          ageCategory: 'EIGHTEEN_PLUS',
          sessionToken: 'verify-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 24*60*60*1000)
        }
      });
      console.log('   ✅ Enum values working correctly');
      
      // Cleanup
      await prisma.tempSession.delete({ where: { id: testSession.id } });
      console.log('   ✅ Test data cleaned up\n');
    } catch (error) {
      console.log(`   ❌ Enum test failed: ${error.message}\n`);
      allPassed = false;
    }

    // Summary
    if (allPassed) {
      console.log('✅ All verification checks passed!');
      console.log('\n📊 Database Summary:');
      console.log(`   - Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'the_chatroom'}`);
      console.log(`   - Tables: ${TABLES.length} tables verified`);
      console.log(`   - Status: Ready for development\n`);
    } else {
      console.log('❌ Some verification checks failed.');
      console.log('   Please review the errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. .env file is configured correctly');
    console.error('  3. Migrations have been run\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
