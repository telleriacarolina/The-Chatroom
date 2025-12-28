# @chatroom/analytics

Analytics tracking service for The Chatroom with multi-provider support.

## Setup

```bash
npm install
npm run build
```

## Features

- **Multi-Provider Support**: Mixpanel, PostHog, Google Analytics
- **Event Tracking**: User actions, page views, custom events
- **User Properties**: Track user attributes and behavior
- **Funnel Analysis**: Track user journey through signup/chat flows
- **A/B Testing**: Support for feature flags and experiments
- **Privacy-First**: GDPR/CCPA compliant tracking
- **Type-Safe**: Full TypeScript support

## Usage

```typescript
import { AnalyticsService } from '@chatroom/analytics';

const analytics = new AnalyticsService({
  providers: {
    mixpanel: { token: process.env.MIXPANEL_TOKEN },
    posthog: { apiKey: process.env.POSTHOG_KEY }
  }
});

// Track events
analytics.track('User Signed Up', {
  userId: '123',
  accountType: 'creator',
  source: 'mobile'
});

// Identify users
analytics.identify('user-123', {
  email: 'user@example.com',
  username: 'JohnDoe',
  plan: 'creator'
});

// Track page views
analytics.page('Chat Room', {
  language: 'english',
  lounge: 'all-users'
});
```

## Tracked Events

### Authentication
- `User Signed Up`
- `User Signed In`
- `User Signed Out`
- `Password Reset Requested`
- `Email Verified`

### Chat Activity
- `Message Sent`
- `Room Joined`
- `Room Left`
- `User Blocked`
- `User Reported`

### Marketplace
- `Item Listed`
- `Item Purchased`
- `Item Viewed`
- `Transaction Completed`

### Engagement
- `Profile Updated`
- `Settings Changed`
- `Verification Started`
- `Subscription Upgraded`

## User Properties

```typescript
analytics.setUserProperties('user-123', {
  accountType: 'creator',
  isPremium: true,
  language: 'english',
  country: 'US',
  totalMessages: 150,
  joinDate: new Date()
});
```

## Funnel Tracking

```typescript
// Track conversion funnel
analytics.trackFunnel('Signup Funnel', {
  step: 'username_created',
  userId: 'guest-123'
});
```

## Environment Variables

```
MIXPANEL_TOKEN=your-mixpanel-token
POSTHOG_API_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com
GA_TRACKING_ID=UA-XXXXXXXXX-X
ANALYTICS_ENABLED=true
```

## Privacy

- All PII is hashed before sending
- IP addresses anonymized
- Respects Do Not Track signals
- GDPR consent handling built-in
