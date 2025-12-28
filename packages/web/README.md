# @chatroom/web

Next.js frontend for The Chatroom application.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18
- **Styling:** Tailwind CSS, shadcn/ui components
- **Icons:** Lucide React
- **Language:** TypeScript + JavaScript (mixed)

## Structure

```
src/
├── app/                # Next.js App Router
│   └── page.tsx        # Home page
├── pages/              # Next.js Pages Router (legacy)
│   ├── _app.jsx
│   └── index.tsx
├── components/
│   ├── chat/           # Chat UI components
│   │   └── Block.tsx   # Main chat interface
│   ├── auth/           # Authentication components
│   └── ui/             # Reusable UI components (shadcn/ui)
├── styles/
│   └── globals.css     # Global styles
└── public/             # Static assets
```

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

## Development

```bash
# Install dependencies (from root)
npm install

# Start dev server
npm run dev:web
```

App runs on http://localhost:3000

## Features

### Authentication Flow
- **Creator Account** - Monetize content, live video
- **Viewer Account** - Watch content, support creators
- **Guest Mode** - Free text chat with temporary username

### Chat Interface
- Username creation with validation
- 8 language categories (English, Spanish, French, German, Japanese, Chinese, Portuguese, Arabic)
- Country-specific lounges per language
- Real-time Socket.IO integration

### UI Components

Using shadcn/ui components:
- Button, Input, Card
- Dialog, Tabs, Alert
- Badge, Progress, Label
- RadioGroup

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Path Aliases

Configured in `tsconfig.json` / `jsconfig.json`:

```typescript
import { Button } from "@/components/ui/button"
import { Block } from "@/components/chat/Block"
```

## Deployment

```bash
npm run build
npm run start
```

## Dependencies

See [package.json](./package.json) for full list.

Key dependencies:
- next
- react, react-dom
- lucide-react
- tailwindcss
- @chatroom/shared (workspace dependency)
