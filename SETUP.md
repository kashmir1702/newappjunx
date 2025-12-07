# JUNXOR Setup Guide

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can get these values from your Supabase project:
- Go to https://supabase.com
- Select your project
- Go to Settings > API
- Copy the URL and anon/public key

### 2. Database Migration

The database schema has been created automatically. Your Supabase database should now have:

**Tables:**
- `user_profiles` - User information and JUNX balance
- `events` - Waste disposal records
- `rewards_catalog` - Available rewards
- `reward_redemptions` - Redemption history
- `badge_definitions` - Badge types
- `user_badges` - User's earned badges
- `leaderboard_cache` - Rankings
- `reward_rules` - Reward calculation rules
- `fraud_logs` - Anti-fraud tracking

**Sample Data Included:**
- 5 default reward rules
- 5 badge definitions
- 5 sample rewards

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

```bash
npm run dev
```

Then:
- Press `w` for web preview
- Press `a` for Android emulator (requires Android Studio)

## Customization Guide

### Adjusting Reward Rules

Reward rules determine how many JUNX tokens users earn for different types of waste.

**To modify existing rules:**

1. Go to Supabase Dashboard > Table Editor
2. Select `reward_rules` table
3. Edit the `junx_amount` for each rule

**Current default rules:**
- Clean Plastic Bottle: 10 JUNX
- Clean Aluminum Can: 12 JUNX
- Clean Paper: 5 JUNX
- Clean Glass: 8 JUNX
- Dirty Plastic: 3 JUNX
- General Waste: 2 JUNX

**To add new rules:**

```sql
INSERT INTO reward_rules (
  rule_name,
  subcategory,
  quality,
  junx_amount,
  priority,
  active
) VALUES (
  'Clean Cardboard',
  'cardboard',
  'clean',
  7,
  10,
  true
);
```

**Rule fields:**
- `rule_name`: Human-readable description
- `subcategory`: Waste type (plastic_bottle, aluminum_can, etc.)
- `quality`: "clean" or "dirty"
- `brand_bonus`: Set to `true` to give bonus for recognized brands
- `junx_amount`: Tokens to award
- `priority`: Lower numbers = higher priority
- `active`: Enable/disable rule

### Customizing Badges

Badges are achievements users can earn through various actions.

**Current badges:**
1. First Timer (1 event)
2. Eco Warrior (10 events)
3. JUNX Master (100 JUNX earned)
4. Monthly Champion (Top 10 monthly)
5. Recycling Hero (50 clean recyclables)

**To add new badges:**

```sql
INSERT INTO badge_definitions (
  name,
  description,
  badge_type,
  threshold_config,
  active
) VALUES (
  'Weekly Warrior',
  'Submit events 7 days in a row',
  'CAMPAIGN',
  '{"consecutive_days": 7}',
  true
);
```

**Badge types:**
- `MONTHLY`: Earned monthly (resets)
- `LIFETIME`: Once per user lifetime
- `CAMPAIGN`: Special time-limited badges
- `INSTITUTION`: Organization-specific badges

### Customizing Rewards

Rewards are items users can purchase with JUNX tokens.

**To add new rewards:**

```sql
INSERT INTO rewards_catalog (
  name,
  description,
  junx_cost,
  category,
  available,
  metadata
) VALUES (
  'Pizza Slice',
  'Free pizza slice at partner restaurants',
  75,
  'food_drink',
  true,
  '{"partner": "PizzaCo"}'
);
```

**Categories:**
- `food_drink`: Food and beverage items
- `transport`: Public transport credits
- `merchandise`: Physical products
- `environmental`: Tree planting, donations
- `digital`: Digital badges, premium features

### Adjusting Image Retention

Images are stored with metadata in the events table. To implement actual image storage:

1. Enable Supabase Storage in your project
2. Create a bucket called `waste-images`
3. Update the event submission flow to upload images:

```typescript
// In lib/api.ts - events.submitEvent()
const { data: imageData, error: uploadError } = await supabase.storage
  .from('waste-images')
  .upload(`${userId}/${eventId}/waste-0.jpg`, imageFile);
```

4. Set TTL/retention policy in Supabase Storage settings

### Privacy Consent Text

To customize the privacy consent text:

1. Edit `app/(tabs)/settings.tsx`
2. Find the privacy consent section
3. Update the description text

To add a full privacy policy:
1. Create a new screen: `app/(tabs)/privacy-policy.tsx`
2. Add navigation in settings
3. Display full policy text

## Testing Accounts

For development/testing, you can create test accounts:

```sql
-- After registering via the app, manually adjust balance for testing
UPDATE user_profiles
SET junx_balance = 1000
WHERE username = 'testuser';

-- Award test badges
INSERT INTO user_badges (user_id, badge_id)
VALUES (
  (SELECT id FROM user_profiles WHERE username = 'testuser'),
  (SELECT id FROM badge_definitions WHERE name = 'First Timer')
);
```

## AI Integration (Future)

The app is designed to work with server-side AI processing. To implement:

### Option 1: Supabase Edge Functions

1. Create edge function:
```bash
supabase functions new process-waste-event
```

2. Implement AI logic:
```typescript
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { eventId, imageUrls } = await req.json();

  // Call AI service (OpenAI Vision, Google Cloud Vision, etc.)
  const aiResult = await classifyWaste(imageUrls);

  // Update event with AI results
  const { data, error } = await supabase
    .from('events')
    .update({
      ai_subcategory: aiResult.subcategory,
      ai_quality: aiResult.quality,
      ai_brand_name: aiResult.brand,
      status: 'VERIFIED'
    })
    .eq('event_id', eventId);

  // Calculate and award JUNX
  await awardJunx(eventId, aiResult);

  return new Response(JSON.stringify({ success: true }));
});
```

3. Deploy:
```bash
supabase functions deploy process-waste-event
```

### Option 2: External Service

Create a webhook endpoint that:
1. Receives event submission
2. Downloads images from Supabase Storage
3. Processes with AI
4. Updates database via Supabase API

## Troubleshooting

### TypeScript Path Errors

If you see "Cannot find module '@/...'":
- This is a TypeScript path resolution issue
- The app will run fine with Metro bundler
- Errors are cosmetic and don't affect functionality

### Camera Permission Issues

On Android:
1. Ensure permissions are in `app.json`
2. Test on a real device, not emulator (for best results)
3. Grant permissions when prompted

### Supabase Connection Issues

1. Verify `.env` values are correct
2. Check Supabase project is active
3. Ensure anon key has proper permissions

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

## Production Deployment

### Android APK

```bash
# Build APK
eas build --platform android --profile preview

# Or build locally
npx expo run:android --variant release
```

### App Store Submission

1. Update `app.json` with proper bundle identifiers
2. Add app icons and splash screens
3. Configure EAS Build
4. Submit to Google Play Store

## Support

For issues:
1. Check Supabase logs (Dashboard > Logs)
2. Check app logs in Expo Dev Tools
3. Verify database RLS policies
4. Review README.md for detailed documentation
