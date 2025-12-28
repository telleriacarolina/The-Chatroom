# @chatroom/cli

Command-line interface for managing The Chatroom application.

## Installation

```bash
npm install -g @chatroom/cli
# or
npm install @chatroom/cli
```

## Usage

```bash
chatroom [command] [options]
```

## Commands

### `create`
Create new resources (user, room, marketplace item)

```bash
chatroom create user
chatroom create room --language english --name "New Lounge"
chatroom create item --user-id 123 --title "My Item"
```

### `db`
Database operations (migrate, seed, backup)

```bash
chatroom db migrate
chatroom db seed
chatroom db backup
chatroom db reset --force
```

### `user`
Manage users

```bash
chatroom user list
chatroom user get <id>
chatroom user ban <id>
chatroom user unban <id>
chatroom user grant-admin <id>
chatroom user revoke-admin <id>
```

### `dev`
Development utilities

```bash
chatroom dev setup          # Initial setup
chatroom dev start          # Start all servers
chatroom dev logs           # View server logs
chatroom dev test-email     # Send test email
chatroom dev reset          # Reset development data
```

### `deploy`
Deployment commands

```bash
chatroom deploy prod        # Deploy to production
chatroom deploy staging     # Deploy to staging
chatroom deploy verify      # Verify deployment
chatroom deploy rollback    # Rollback deployment
```

### `analytics`
Analytics commands

```bash
chatroom analytics export --format csv --start 2025-01-01 --end 2025-12-31
chatroom analytics summary
chatroom analytics users --active-days 7
```

## Options

- `-v, --verbose` - Enable verbose logging
- `--no-color` - Disable colored output
- `--api-url <url>` - Override API URL
- `--config <file>` - Use custom config file

## Configuration

Create `.chatroomrc.json` in your project root:

```json
{
  "apiUrl": "http://localhost:3001",
  "socketUrl": "http://localhost:3002",
  "adminKey": "your-admin-key",
  "environment": "development"
}
```

## Examples

```bash
# Setup development environment
chatroom dev setup

# Create a test user
chatroom create user --name "Test User" --phone "+1234567890"

# Run database migrations
chatroom db migrate

# Export analytics data
chatroom analytics export --format csv --output ./data.csv

# Deploy to production
chatroom deploy prod --tag v1.0.0
```

## Interactive Mode

Run without arguments for interactive setup:

```bash
chatroom create      # Interactive user creation
chatroom deploy      # Interactive deployment wizard
```

## Environment Variables

```
CHATROOM_API_URL=http://localhost:3001
CHATROOM_ADMIN_KEY=your-secret-key
CHATROOM_ENV=development
```
