# Database Setup Guide

This guide explains how the database has been initialized for The Chatroom application.

## Database Configuration

### PostgreSQL Database
- **Database Name:** `the_chatroom`
- **User:** `chatroom_user`
- **Connection String:** `postgresql://chatroom_user:chatroom_pass@localhost:5432/the_chatroom`

### Environment Variables
The `.env` file has been created with the following configuration:

```bash
DATABASE_URL=postgresql://chatroom_user:chatroom_pass@localhost:5432/the_chatroom
ACCESS_TOKEN_SECRET=<generated-secret>
REFRESH_TOKEN_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-key>
PHONE_ENC_KEY=<generated-key>
NODE_ENV=development
PORT=3001
SOCKET_PORT=3002
FRONTEND_URL=http://localhost:3000
```

**Note:** The `.env` file is in `.gitignore` and will not be committed to the repository.

## Database Schema

### Tables Created
The following tables have been created in the database:

1. **User** - User accounts and profiles
2. **Session** - Authentication sessions (JWT refresh tokens)
3. **TempSession** - Guest user sessions
4. **Lounge** - Main chat lounges
5. **LanguageRoom** - Language-specific rooms within lounges
6. **ChatMessage** - Chat messages
7. **MarketplaceItem** - Marketplace items for sale
8. **Transaction** - Purchase transactions
9. **ModerationAction** - Moderation actions taken
10. **UserReport** - User-submitted reports
11. **IDVerification** - ID/age verification records
12. **AuditLog** - System audit trail

### Schema Changes Made
During initialization, the following fixes were applied to `packages/api/prisma/schema.prisma`:

1. **Fixed AgeCategory enum:** Uses `PLUS_18` and `PLUS_18_RED` (Prisma doesn't support enum values starting with underscore+number)

2. **Added missing relations:**
   - Added `deletedMessages` relation to User model for tracking message deletions
   - Added `reportsReceived` relation to User model for reports filed against users
   - Added `moderationActions` and `reports` arrays to ChatMessage model
   - Added `moderationActions` and `reports` arrays to MarketplaceItem model

## Running Migrations

### Initial Setup (Already Completed)
```bash
# Navigate to the API package
cd packages/api

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Future Migrations
When making schema changes:

```bash
# 1. Edit packages/api/prisma/schema.prisma
# 2. Navigate to the API package
cd packages/api

# 3. Generate new migration
npm run prisma:migrate

# Or with custom name
npx prisma migrate dev --name your_migration_name
```

## Verifying the Setup

### Check Database Connection
```bash
# Using psql
psql postgresql://chatroom_user:chatroom_pass@localhost:5432/the_chatroom -c "\dt"

# Using Node.js
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Error:', err))
  .finally(() => prisma.\$disconnect());
"
```

### View Table Schema
```bash
# View User table structure
psql postgresql://chatroom_user:chatroom_pass@localhost:5432/the_chatroom -c "\d \"User\""

# View all tables
psql postgresql://chatroom_user:chatroom_pass@localhost:5432/the_chatroom -c "\dt"
```

## Troubleshooting

### PostgreSQL Not Running
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Check status
pg_isready
```

### Permission Issues
If you get permission errors during migrations:
```bash
# Grant CREATEDB permission (needed for shadow database)
sudo -u postgres psql -c "ALTER USER chatroom_user CREATEDB;"
```

### Reset Database (Development Only)
```bash
# Navigate to the API package
cd packages/api

# WARNING: This will delete all data!
npx prisma migrate reset
```

## Migration Files

Migrations are stored in `packages/api/prisma/migrations/`:
- `20251228071826_init/migration.sql` - Initial database schema

## Next Steps

1. **Start the API server:**
   ```bash
   npm run dev:api
   ```

2. **Start the Socket.IO server:**
   ```bash
   npm run dev:socket
   ```

3. **Start the Next.js frontend:**
   ```bash
   npm run dev:web
   ```

## Important Notes

- The `.env` file contains sensitive information and should never be committed to version control
- In production, use strong passwords and different credentials
- The current setup uses a local PostgreSQL instance; production should use a managed database service
- Make sure to run migrations in staging before deploying to production

## Code Usage

### Using Prisma Client in Code

```javascript
// Import Prisma client
const { PrismaClient } = require('@prisma/client');
// Or import from the lib/prisma.ts file
const prisma = require('./lib/prisma');

// Example: Create a temp session (guest user)
const tempSession = await prisma.tempSession.create({
  data: {
    temporaryUsername: 'guest_abc123',
    ageCategory: 'PLUS_18', // or 'PLUS_18_RED'
    sessionToken: 'unique-token',
    expiresAt: new Date(Date.now() + 24*60*60*1000)
  }
});

// Example: Find users
const users = await prisma.user.findMany({
  where: {
    accountStatus: 'ACTIVE'
  }
});
```

For more information, see:
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
