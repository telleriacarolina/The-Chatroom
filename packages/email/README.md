# @chatroom/email

Email service for The Chatroom with templating and multi-provider support.

## Setup

```bash
npm install
npm run build
```

## Features

- **Email Templates**: Pre-built templates for all user communications
- **Multi-Provider**: Support for SendGrid, NodeMailer, AWS SES
- **HTML & Plain Text**: Automatic plain text generation
- **Template Engine**: Handlebars-based templates
- **Responsive Design**: MJML for mobile-friendly emails
- **Inline CSS**: Automatic CSS inlining with Juice
- **Type-Safe**: Full TypeScript support

## Usage

```typescript
import { EmailService } from '@chatroom/email';

const emailService = new EmailService({
  provider: 'sendgrid',
  apiKey: process.env.SENDGRID_API_KEY
});

// Send welcome email
await emailService.sendWelcome({
  to: 'user@example.com',
  username: 'JohnDoe',
  verificationLink: 'https://chatroom.com/verify/token'
});

// Send password reset
await emailService.sendPasswordReset({
  to: 'user@example.com',
  resetLink: 'https://chatroom.com/reset/token'
});
```

## Available Templates

- `welcome` - New user registration
- `passwordReset` - Password reset request
- `verificationApproved` - ID verification approved
- `verificationRejected` - ID verification rejected
- `newMessage` - New message notification (if enabled)
- `subscriptionExpiring` - Subscription expiry warning
- `purchaseReceipt` - Marketplace purchase receipt
- `moderationWarning` - Content moderation warning

## Environment Variables

```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
FROM_EMAIL=noreply@chatroom.com
FROM_NAME=The Chatroom
```

## Custom Templates

Create new templates in `src/templates/`:

```typescript
// src/templates/custom.hbs
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Hello {{username}}!</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```
