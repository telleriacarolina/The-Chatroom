# @chatroom/shared

Shared types, schemas, and utilities used across The Chatroom packages.

## Purpose

This package contains code shared between `@chatroom/api`, `@chatroom/socket`, and `@chatroom/web` to avoid duplication and ensure consistency.

## Structure

```
src/
├── types/              # TypeScript type definitions
│   ├── user.ts
│   ├── session.ts
│   ├── chatMessage.ts
│   ├── lounge.ts
│   ├── languageRoom.ts
│   ├── marketplaceItem.ts
│   ├── transaction.ts
│   ├── moderationAction.ts
│   ├── userReport.ts
│   ├── verification.ts
│   └── auditLog.ts
├── schemas/            # JSON schemas for validation
│   └── *.schema.json
├── utils/              # Shared utilities
│   └── cn.ts           # className utility
└── index.ts            # Main exports
```

## Usage

### In API package:

```typescript
import { User, Session } from '@chatroom/shared/types';
import { userSchema } from '@chatroom/shared/schemas';
```

### In Web package:

```typescript
import { User } from '@chatroom/shared/types';
import { cn } from '@chatroom/shared/utils';
```

### In Socket package:

```javascript
const { ChatMessage } = require('@chatroom/shared/types');
```

## Exports

The package exports are configured in `package.json`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

## Type Definitions

All TypeScript interfaces match the Prisma schema:

- **User** - Account data, profile, verification
- **Session** - JWT session management
- **TempSession** - Guest sessions
- **ChatMessage** - Messages with moderation flags
- **Lounge** - Chat room definitions
- **LanguageRoom** - Language-specific rooms
- **MarketplaceItem** - User content for sale
- **Transaction** - Payment records
- **ModerationAction** - Mod action logs
- **UserReport** - Reporting system
- **IDVerification** - Age/ID verification
- **AuditLog** - System audit trail

## Adding New Shared Code

1. Add your type/utility to the appropriate directory
2. Export it from the directory's `index.ts`
3. Update the main `src/index.ts` if needed
4. The change is automatically available to all packages

## Development

No build step required - packages import directly from source files.

## Dependencies

Minimal dependencies to keep this package lean. Most code should have zero runtime dependencies.
