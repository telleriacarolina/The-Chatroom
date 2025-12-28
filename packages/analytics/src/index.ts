import Mixpanel from 'mixpanel';
import { PostHog } from 'posthog-node';

export interface AnalyticsConfig {
  providers: {
    mixpanel?: { token: string };
    posthog?: { apiKey: string; host?: string };
  };
  enabled?: boolean;
}

export interface EventProperties {
  [key: string]: any;
}

export interface UserProperties {
  email?: string;
  username?: string;
  accountType?: string;
  plan?: string;
  [key: string]: any;
}

export class AnalyticsService {
  private mixpanel?: Mixpanel.Mixpanel;
  private posthog?: PostHog;
  private enabled: boolean;

  constructor(config: AnalyticsConfig) {
    this.enabled = config.enabled !== false;

    if (this.enabled) {
      if (config.providers.mixpanel) {
        this.mixpanel = Mixpanel.init(config.providers.mixpanel.token);
      }

      if (config.providers.posthog) {
        this.posthog = new PostHog(
          config.providers.posthog.apiKey,
          { host: config.providers.posthog.host }
        );
      }
    }
  }

  /**
   * Track an event
   */
  track(event: string, properties: EventProperties = {}): void {
    if (!this.enabled) return;

    const userId = properties.userId || properties.distinctId;
    const enrichedProps = {
      ...properties,
      timestamp: new Date().toISOString(),
    };

    if (this.mixpanel && userId) {
      this.mixpanel.track(event, {
        distinct_id: userId,
        ...enrichedProps,
      });
    }

    if (this.posthog && userId) {
      this.posthog.capture({
        distinctId: userId,
        event,
        properties: enrichedProps,
      });
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties: UserProperties = {}): void {
    if (!this.enabled) return;

    if (this.mixpanel) {
      this.mixpanel.people.set(userId, properties);
    }

    if (this.posthog) {
      this.posthog.identify({
        distinctId: userId,
        properties,
      });
    }
  }

  /**
   * Track page view
   */
  page(name: string, properties: EventProperties = {}): void {
    this.track('Page Viewed', {
      pageName: name,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(userId: string, properties: UserProperties): void {
    this.identify(userId, properties);
  }

  /**
   * Track funnel step
   */
  trackFunnel(funnelName: string, data: { step: string; userId: string; [key: string]: any }): void {
    this.track(`${funnelName} - ${data.step}`, data);
  }

  /**
   * Increment a user property
   */
  increment(userId: string, property: string, amount: number = 1): void {
    if (!this.enabled) return;

    if (this.mixpanel) {
      this.mixpanel.people.increment(userId, property, amount);
    }
  }

  /**
   * Flush pending events (important before app shutdown)
   */
  async flush(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}

// Pre-defined event names for consistency
export const Events = {
  // Auth
  USER_SIGNED_UP: 'User Signed Up',
  USER_SIGNED_IN: 'User Signed In',
  USER_SIGNED_OUT: 'User Signed Out',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  
  // Chat
  MESSAGE_SENT: 'Message Sent',
  ROOM_JOINED: 'Room Joined',
  ROOM_LEFT: 'Room Left',
  
  // Marketplace
  ITEM_LISTED: 'Item Listed',
  ITEM_PURCHASED: 'Item Purchased',
  ITEM_VIEWED: 'Item Viewed',
  
  // Engagement
  PROFILE_UPDATED: 'Profile Updated',
  VERIFICATION_STARTED: 'Verification Started',
  SUBSCRIPTION_UPGRADED: 'Subscription Upgraded',
} as const;

export default AnalyticsService;
