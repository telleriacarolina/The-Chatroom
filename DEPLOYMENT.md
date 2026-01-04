# Deployment Guide for Apple Platforms

This guide covers deploying The Chatroom to Apple platforms (iOS, iPadOS, macOS).

## Progressive Web App (PWA) - Recommended ✅

The Chatroom is now configured as a Progressive Web App that works on all Apple devices.

### Features Implemented

✅ **Installable on iOS/iPadOS:**
- Users can add the app to their home screen
- Runs in standalone mode (no browser UI)
- Native app-like experience

✅ **Offline Support:**
- Service Worker caches static assets
- Works without internet connection
- Automatic updates

✅ **Push Notifications:**
- Ready for push notification integration
- Permission prompt included
- Notification handling configured

✅ **Optimized for Apple:**
- Apple touch icons
- Status bar styling
- Splash screen support
- Safari meta tags

### User Installation Instructions

#### iPhone/iPad (iOS/iPadOS)
1. Open Safari and navigate to your deployed site
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The Chatroom icon appears on your home screen

#### Mac (macOS Safari)
1. Open Safari and navigate to your deployed site
2. Click File menu → Add to Dock
3. The app appears in your Dock
4. Opens as standalone app

### Files Added

- `/public/manifest.json` - PWA manifest with icons and metadata
- `/public/sw.js` - Service Worker for offline functionality
- `/app/layout.tsx` - Next.js layout with PWA meta tags
- `/components/PwaPrompt.tsx` - Install prompt component
- `/lib/pwa.ts` - PWA utility functions
- `DEPLOYMENT.md` - This guide

### Icon Requirements

Create app icons in the following sizes and place in `/public/`:
- `icon-72.png` (72x72)
- `icon-96.png` (96x96)
- `icon-128.png` (128x128)
- `icon-144.png` (144x144)
- `icon-152.png` (152x152) - iOS home screen
- `icon-180.png` (180x180) - iOS retina
- `icon-192.png` (192x192)
- `icon-384.png` (384x384)
- `icon-512.png` (512x512)

**Icon Design Guidelines:**
- Use your app's primary branding color (#700303)
- Include the MessageSquare + Flame icon combination
- Ensure adequate contrast and padding
- Test on both light and dark backgrounds

You can use tools like:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- Figma with export settings
- Adobe Illustrator

### Optional Screenshots

Add screenshots to `/public/` for app stores and install prompts:
- `screenshot-mobile.png` (750x1334) - iPhone view
- `screenshot-desktop.png` (1920x1080) - Desktop view

## Deployment Platforms

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

Configure environment variables in Vercel dashboard:
- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `PHONE_ENC_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (for push notifications)

### Custom Domain

After deployment, add a custom domain:
1. Go to Vercel project settings
2. Add custom domain
3. Update DNS records
4. SSL certificate auto-configured

## Native App Development (Future)

For full native app capabilities:

### React Native Expo

```bash
npx create-expo-app chatroom-mobile
cd chatroom-mobile
npm install socket.io-client @react-navigation/native
```

Benefits:
- Full native iOS/Android apps
- Access to device features (camera, contacts, etc.)
- App Store distribution
- Push notifications via Apple Push Notification service

### Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap open ios
```

Benefits:
- Wraps existing Next.js app
- Native plugin access
- Easier than full rewrite
- Maintains web app codebase

## Testing PWA Features

### iOS Simulator (Xcode Required)

```bash
# Install Xcode from Mac App Store
# Then run:
xcrun simctl boot "iPhone 15 Pro"
open -a Simulator
```

Navigate to your localhost or deployed URL in Safari.

### Real Device Testing

1. Deploy to Vercel or similar platform with HTTPS
2. Open on iPhone/iPad Safari
3. Test "Add to Home Screen" functionality
4. Test offline mode (enable Airplane mode)
5. Test notifications (if implemented)

## Push Notifications Setup (Optional)

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Add to environment variables:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### Backend Integration

Add to your Express server:

```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
app.post('/api/notify', async (req, res) => {
  const subscription = req.body.subscription;
  const payload = JSON.stringify({
    title: 'New Message',
    body: 'You have a new message in The Chatroom'
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## App Store Submission (Native App Only)

If you build with React Native or Capacitor:

1. **Join Apple Developer Program** ($99/year)
   - https://developer.apple.com/programs/

2. **Prepare App Store Assets**
   - App icon (1024x1024)
   - Screenshots (various sizes)
   - Privacy policy URL
   - App description

3. **Build & Archive**
   - Use Xcode or Expo's build service
   - Create production build

4. **Submit via App Store Connect**
   - Upload build
   - Fill app information
   - Submit for review

## Troubleshooting

### PWA Not Installing
- Ensure HTTPS is enabled (required for service workers)
- Check browser console for errors
- Verify manifest.json is accessible at `/manifest.json`
- Check that icons exist and are correct format

### Service Worker Not Registering
- Clear browser cache
- Check service worker in DevTools → Application → Service Workers
- Ensure `sw.js` is in `/public/` directory
- Verify no syntax errors in service worker

### Icons Not Showing
- Ensure PNG format (not JPEG)
- Check file sizes match manifest
- Use correct paths (relative to public directory)
- Test with Chrome DevTools → Application → Manifest

### iOS Specific Issues
- Requires Safari (Chrome on iOS won't show install prompt)
- Must be accessed via HTTPS
- Some features limited in iOS WebKit
- Test in both portrait and landscape

## Resources

- [PWA Builder](https://www.pwabuilder.com/) - Test and enhance your PWA
- [Apple PWA Documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Can I Use PWA](https://caniuse.com/web-app-manifest)

## Next Steps

1. ✅ Generate and add app icons to `/public/`
2. ✅ Deploy to Vercel or similar platform
3. ✅ Test installation on iPhone/iPad
4. ☐ Set up push notifications (optional)
5. ☐ Add to your marketing materials
6. ☐ Consider native app if needed

---

For questions or issues, refer to the main [README.md](./README.md) or create an issue on GitHub.
