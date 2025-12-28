# @chatroom/admin

Admin panel for The Chatroom - manage users, content, and moderation.

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Access at: http://localhost:3003

## Features

- **User Management**: View, search, suspend, and ban users
- **Content Moderation**: Review flagged messages and marketplace items
- **Analytics Dashboard**: Real-time stats and charts
- **Verification Review**: Approve/reject ID verifications
- **Transaction Monitoring**: View payment history and disputes
- **Audit Logs**: Track all admin actions

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query (data fetching)
- TanStack Table (data tables)
- Recharts (analytics)
- Shared types from @chatroom/shared

## Environment Variables

Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
ADMIN_API_KEY=your-secret-admin-key
```

## Pages

- `/` - Dashboard overview
- `/users` - User management
- `/moderation` - Content moderation queue
- `/verifications` - ID verification review
- `/transactions` - Payment transactions
- `/analytics` - Detailed analytics
- `/audit-logs` - System audit trail

## Authentication

Admin panel requires authentication. Integrate with your existing auth system.
