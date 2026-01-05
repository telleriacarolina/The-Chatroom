# New Packages Overview

## 📦 Package Summary

Your monorepo now includes **9 packages** total:

### Core Packages (Existing)

1. **@chatroom/api** - Backend REST API (Express + Prisma)
2. **@chatroom/socket** - WebSocket server (Socket.IO)
3. **@chatroom/web** - Frontend (Next.js)
4. **@chatroom/shared** - Shared types and utilities

### New Packages

1. **@chatroom/mobile** - Mobile app (React Native + Expo)
2. **@chatroom/admin** - Admin panel (Next.js)
3. **@chatroom/email** - Email service (Nodemailer + templates)
4. **@chatroom/analytics** - Analytics tracking (Mixpanel + PostHog)
5. **@chatroom/cli** - Command-line tools (Commander)

---

## 📱 Mobile App (@chatroom/mobile)

**Location:** `packages/mobile/`

### Mobile Features

- Cross-platform iOS & Android
- Real-time chat with Socket.IO
- Shared types from @chatroom/shared
- React Navigation
- Expo framework

### Mobile Commands

```bash
npm run dev:mobile     # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
```

### Use Cases

- Native mobile experience
- Push notifications
- Camera/photo access
- Offline support

---

## 👨‍💼 Admin Panel (@chatroom/admin)

**Location:** `packages/admin/`  
**Port:** 3003

### Admin Panel Features

- User management dashboard
- Content moderation queue
- Analytics visualizations (Recharts)
- ID verification review
- Transaction monitoring
- Audit logs viewer
- Data tables (TanStack Table)

### Admin Panel Commands

```bash
npm run dev:admin      # Start admin panel
npm run build:admin    # Build for production
npm run start:admin    # Start production server
```

### Pages

- `/` - Dashboard overview
- `/users` - User management
- `/moderation` - Content review
- `/verifications` - ID verification
- `/transactions` - Payments
- `/analytics` - Charts & stats

---

## 📧 Email Service (@chatroom/email)

**Location:** `packages/email/`

### Email Service Features

- Multi-provider support (SendGrid, SMTP, AWS SES)
- Handlebars templating
- MJML responsive emails
- Automatic CSS inlining
- Plain text generation
- TypeScript types

### Usage Example in API

```typescript
import { EmailService } from '@chatroom/email';

const emailService = new EmailService({
  provider: 'sendgrid',
  apiKey: process.env.SENDGRID_API_KEY
});

await emailService.sendWelcome({
  to: 'user@example.com',
  username: 'JohnDoe'
});
```

### Templates Included

- `welcome.hbs` - New user welcome
- `password-reset.hbs` - Password reset
- `verification-approved.hbs` - ID verification approved

### Email Service Commands

```bash
npm run build:email    # Build TypeScript
```

---

## 📊 Analytics (@chatroom/analytics)

**Location:** `packages/analytics/`

### Analytics Features

- Multi-provider (Mixpanel, PostHog, GA)
- Event tracking
- User properties
- Funnel analysis
- Privacy-compliant (GDPR/CCPA)
- Type-safe events

### Usage in API

```typescript
import { AnalyticsService, Events } from '@chatroom/analytics';

const analytics = new AnalyticsService({
  providers: {
    mixpanel: { token: process.env.MIXPANEL_TOKEN }
  }
});

analytics.track(Events.USER_SIGNED_UP, {
  userId: '123',
  accountType: 'creator'
});
```

### Pre-defined Events

- `USER_SIGNED_UP`, `USER_SIGNED_IN`
- `MESSAGE_SENT`, `ROOM_JOINED`
- `ITEM_PURCHASED`, `ITEM_LISTED`
- `VERIFICATION_STARTED`

### Analytics Commands

```bash
npm run build:analytics    # Build TypeScript
```

---

## 🛠️ CLI Tools (@chatroom/cli)

**Location:** `packages/cli/`

### Features

- User management commands
- Database operations
- Development utilities
- Deployment tools
- Analytics export
- Interactive prompts

### Commands

#### Database

```bash
npm run cli -- db migrate    # Run migrations
npm run cli -- db seed       # Seed data
npm run cli -- db reset      # Reset database
```

#### User Management

```bash
npm run cli -- user list
npm run cli -- user ban <id>
npm run cli -- user grant-admin <id>
```

#### Development

```bash
npm run cli -- dev setup     # Initial setup
npm run cli -- dev start     # Start all servers
npm run cli -- dev test-email
```

#### Deployment

```bash
npm run cli -- deploy prod
npm run cli -- deploy staging
npm run cli -- deploy verify
```

#### Analytics

```bash
npm run cli -- analytics export --format csv
npm run cli -- analytics summary
```

### Build

```bash
npm run build:cli       # Build TypeScript
```

---

## 🚀 Quick Start

### Install All Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Start Development

```bash
# All services
npm run dev

# Individual services
npm run dev:api         # API (port 3001)
npm run dev:socket      # Socket.IO (port 3002)
npm run dev:web         # Frontend (port 3000)
npm run dev:admin       # Admin Panel (port 3003)
npm run dev:mobile      # Mobile app (Expo)
```

### Use CLI Tools

```bash
npm run cli -- --help
npm run cli -- dev setup
npm run cli -- user list
```

---

## 🔗 Package Dependencies

### Dependency Graph

```,

@chatroom/shared
    ↓
@chatroom/api ← @chatroom/analytics
    ↓         ← @chatroom/email
@chatroom/socket
    ↓
@chatroom/web
@chatroom/admin
@chatroom/mobile
@chatroom/cli
```

### Usage Examples

#### API using Email & Analytics

```typescript
// packages/api/src/routes/auth.js
import { EmailService } from '@chatroom/email';
import { AnalyticsService, Events } from '@chatroom/analytics';

const email = new EmailService(config);
const analytics = new AnalyticsService(config);

router.post('/signup', async (req, res) => {
  const user = await createUser(req.body);
  
  // Send welcome email
  await email.sendWelcome({
    to: user.email,
    username: user.username
  });
  
  // Track signup
  analytics.track(Events.USER_SIGNED_UP, {
    userId: user.id,
    accountType: user.accountType
  });
  
  res.json({ success: true });
});
```

#### Web using Shared Types

```typescript
// packages/web/src/components/UserProfile.tsx
import type { User } from '@chatroom/shared';

export function UserProfile({ user }: { user: User }) {
  return <div>{user.username}</div>;
}
```

#### CLI using API Client

```typescript
// packages/cli/src/commands/user.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3001'
});

const users = await api.get('/api/users');
```

---

## 📋 Environment Variables

### API Package

```bash
DATABASE_URL=postgresql://...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
SENDGRID_API_KEY=...          # For email
MIXPANEL_TOKEN=...            # For analytics
```

### Admin Package

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
ADMIN_API_KEY=...
```

### Mobile Package

```bash
API_URL=http://localhost:3001
SOCKET_URL=http://localhost:3002
```

### CLI Package

```bash
CHATROOM_API_URL=http://localhost:3001
CHATROOM_ADMIN_KEY=...
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific packages
npm test -w @chatroom/api
npm test -w @chatroom/email
npm test -w @chatroom/analytics
```

---

## 🎯 Next Steps

1. **Install dependencies:** `npm install`
2. **Build packages:** `npm run build`
3. **Set up environment files** for each package
4. **Start services:** `npm run dev`
5. **Access applications:**
   - Frontend: <http://localhost:3000>
   - API: <http://localhost:3001>
   - Socket.IO: <http://localhost:3002>
   - Admin: <http://localhost:3003>

6. **Try CLI tools:**

   ```bash
   npm run cli -- dev setup
   npm run cli -- user list
   npm run cli -- analytics summary
   ```

---

## 📚 Documentation

- **API:** `packages/api/README.md`
- **Socket:** `packages/socket/README.md`
- **Web:** `packages/web/README.md`
- **Admin:** `packages/admin/README.md`
- **Mobile:** `packages/mobile/README.md`
- **Email:** `packages/email/README.md`
- **Analytics:** `packages/analytics/README.md`
- **CLI:** `packages/cli/README.md`

---

## 🎉 Success

Your monorepo now has a complete ecosystem:

- ✅ Backend API & WebSocket
- ✅ Web frontend
- ✅ Mobile app
- ✅ Admin panel
- ✅ Email service
- ✅ Analytics tracking
- ✅ CLI tools

All packages share code through `@chatroom/shared` and work together seamlessly! 🚀

## Tests for NEW_PACKAGES.md

## Section Presence

- [ ] The document includes a section for each of the following packages:
  - @chatroom/api
  - @chatroom/socket
  - @chatroom/web
  - @chatroom/shared
  - @chatroom/mobile
  - @chatroom/admin
  - @chatroom/email
  - @chatroom/analytics
  - @chatroom/cli

## Commands and Usage

- [ ] Each package section lists relevant npm scripts/commands in fenced code blocks with language specified (e.g., `bash`).
- [ ] The "Quick Start" section includes commands for installing, building, and starting all services.
- [ ] The CLI section documents at least one command for each feature area (db, user, dev, deploy, analytics).

## Example Usages

- [ ] The API section includes a TypeScript usage example for EmailService and AnalyticsService.
- [ ] The Web section includes a TypeScript usage example for importing shared types.
- [ ] The CLI section includes a TypeScript usage example for making API requests.

## Environment Variables

- [ ] There is a section listing required environment variables for each package.
- [ ] Each environment variable block is fenced with `bash`.

## Package Dependency Graph

- [ ] The dependency graph is present and visually shows the relationships between packages.

## Testing Section

- [ ] There is a section describing how to run tests for all and individual packages.
- [ ] All code blocks in this section are fenced with `bash`.

## Next Steps

- [ ] The "Next Steps" section lists a step-by-step process for getting started.
- [ ] Each step is clear and actionable.

## Documentation Links

- [ ] The "Documentation" section lists a README for each package.
- [ ] Each listed README path matches the package name.

## Fenced Code Block Language (MD040)

- [ ] All code blocks use a language specifier (e.g., `bash`, `typescript`, `json`, `markdown`).

## Success Criteria

- [ ] The "Success" section summarizes the ecosystem and confirms all packages are integrated.

---

## Manual Verification Steps

1. Open `NEW_PACKAGES.md`.
2. For each checklist item above, verify the content is present and correct.
3. For code blocks, ensure the language is specified after the opening triple backticks.
4. For usage examples, check that imports and code match the described package APIs.
5. For environment variables, confirm all required variables are listed for each package.
6. For commands, try running them in your terminal to ensure they work as described (where possible).

---

## Example: Fenced Code Block Language Test

```bash
# This is a correctly fenced bash code block
npm run dev:api
```

```typescript
// This is a correctly fenced TypeScript code block
import { EmailService } from '@chatroom/email';
```
