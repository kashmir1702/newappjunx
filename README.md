# JUNXOR - Waste Disposal Tracking & Rewards App

JUNXOR turns waste disposal into a trackable, AI-verified, rewardable action. Capture photos of your waste disposal, earn JUNX tokens, collect badges, and climb the leaderboard!

## Features

### MVP (Current Implementation)

- **Authentication**
  - Username/password registration and login
  - Password reset flow
  - Secure token storage with expo-secure-store

- **Dashboard**
  - View JUNX balance
  - See recent badges
  - Quick access to create new disposal events
  - Activity statistics

- **Waste Event Tracking**
  - Capture 1-3 waste photos
  - Capture 1 bin photo (mandatory)
  - Image hashing for fraud detection
  - Event submission with progress tracking
  - Event history with AI classification results

- **Rewards System**
  - Server-driven rewards catalog
  - Redeem JUNX tokens for rewards
  - Track redemption history

- **Badges**
  - Stacked badge collection system
  - Multiple badge types (Monthly, Lifetime, Campaign, Institution)
  - Achievement tracking

- **Leaderboard**
  - Global rankings
  - Multiple time windows (Daily, Weekly, Monthly, All-Time)
  - Highlight current user position

- **Settings**
  - Privacy consent management
  - Account information
  - Logout functionality

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Camera**: expo-camera & expo-image-picker
- **State Management**: React Context API
- **Language**: TypeScript

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Supabase account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at https://supabase.com
2. The database schema has already been created via migration
3. Copy your Supabase credentials:
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup

The database schema includes:
- `user_profiles` - Extended user information
- `events` - Waste disposal event records
- `rewards_catalog` - Available rewards
- `reward_redemptions` - User redemption history
- `badge_definitions` - Badge types and rules
- `user_badges` - Earned badges
- `leaderboard_cache` - Ranking data
- `reward_rules` - Configurable reward calculation
- `fraud_logs` - Anti-fraud tracking

Sample data has been pre-populated for:
- Default reward rules (adjustable)
- Badge definitions (adjustable)
- Rewards catalog (adjustable)

### 5. Run the App

For web preview:
```bash
npm run dev
```

For Android:
```bash
npm run dev
# Then press 'a' to open in Android emulator
```

## Project Structure

```
junxor/
├── app/
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── index.tsx        # Dashboard
│   │   ├── events.tsx       # Event history
│   │   ├── rewards.tsx      # Rewards catalog
│   │   ├── badges.tsx       # Badges collection
│   │   ├── leaderboard.tsx  # Rankings
│   │   ├── settings.tsx     # User settings
│   │   └── new-event.tsx    # Camera capture flow
│   └── _layout.tsx          # Root layout with auth routing
├── contexts/
│   └── AuthContext.tsx      # Authentication state management
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   └── api.ts               # API functions
├── types/
│   ├── database.ts          # TypeScript types
│   └── env.d.ts             # Environment variable types
└── assets/                  # Images and icons
```

## Data Flow

### Event Submission Flow

1. **Client Side**:
   - User captures 1-3 waste photos + 1 bin photo
   - App generates SHA-256 hashes of images
   - Creates event draft with metadata
   - Submits to server

2. **Server Side** (To Be Implemented):
   - Validates authentication and schema
   - Stores images temporarily
   - Runs AI classification:
     - Waste type detection
     - Cleanliness assessment
     - Brand/barcode extraction
   - Applies anti-fraud rules:
     - Duplicate hash detection
     - Velocity limits
     - Pattern analysis
   - Calculates rewards based on rules
   - Updates user balance, badges, leaderboard
   - Returns result to client

### Anti-Fraud Measures

- **Image Hashing**: SHA-256 hash detection prevents duplicate submissions
- **Mandatory Bin Photo**: Ensures context and proof of disposal
- **Velocity Limits**: Rate limiting on event submissions
- **Device Tracking**: Device ID monitoring for suspicious patterns
- **Behavioral Analysis**: Server-side pattern detection

## Configurable Elements

### Reward Rules

Edit the `reward_rules` table in Supabase to adjust:
- JUNX amounts per waste type
- Quality multipliers (clean vs dirty)
- Brand bonuses
- Rule priorities

Example:
```sql
INSERT INTO reward_rules (rule_name, subcategory, quality, junx_amount, priority)
VALUES ('Clean Plastic Bottle', 'plastic_bottle', 'clean', 10, 10);
```

### Badge Definitions

Edit the `badge_definitions` table to create new badges:
```sql
INSERT INTO badge_definitions (name, description, badge_type, threshold_config)
VALUES ('Eco Champion', 'Submit 100 events', 'LIFETIME', '{"events_required": 100}');
```

### Rewards Catalog

Add new rewards in the `rewards_catalog` table:
```sql
INSERT INTO rewards_catalog (name, description, junx_cost, category)
VALUES ('Free Coffee', 'Redeem at partner cafes', 50, 'food_drink');
```

## Future Enhancements

### Planned Features
- iOS support
- Real partner integrations (coupons, transport credits)
- Campus/company dashboards
- Advanced anomaly detection
- Location-based features
- Smart bin integrations
- Image storage with Supabase Storage
- Real-time AI processing
- Push notifications

### AI Integration (Placeholder)

The current implementation stores image hashes and metadata. To add AI processing:

1. Set up an AI service (OpenAI Vision, Google Cloud Vision, or custom model)
2. Create a Supabase Edge Function to process images
3. Update event records with AI results
4. Trigger reward calculation

Example edge function structure:
```typescript
// supabase/functions/process-event/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  // 1. Fetch event images
  // 2. Call AI service
  // 3. Extract waste type, brand, barcode
  // 4. Apply fraud checks
  // 5. Calculate rewards
  // 6. Update event record
  // 7. Update user balance/badges/leaderboard
});
```

## API Reference

### Authentication

- `api.auth.register(username, email, password)` - Register new user
- `api.auth.login(email, password)` - Login user
- `api.auth.logout()` - Logout user
- `api.auth.resetPasswordRequest(email)` - Request password reset
- `api.auth.resetPasswordConfirm(newPassword)` - Confirm password reset

### Events

- `api.events.getEvents(userId)` - Get user's event history
- `api.events.getEvent(eventId)` - Get single event
- `api.events.submitEvent(draft)` - Submit new event

### Rewards

- `api.rewards.getCatalog()` - Get available rewards
- `api.rewards.redeemReward(userId, rewardId, cost)` - Redeem reward
- `api.rewards.getRedemptions(userId)` - Get redemption history

### Badges

- `api.badges.getUserBadges(userId)` - Get user's badges
- `api.badges.getAllBadges()` - Get all badge definitions

### Leaderboard

- `api.leaderboard.getLeaderboard(timeWindow, limit)` - Get rankings

### Utils

- `api.utils.hashImage(uri)` - Generate SHA-256 hash
- `api.utils.generateEventId()` - Generate unique event ID

## Security Considerations

- All database tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Tokens stored securely with expo-secure-store
- Server-side signature verification for audit integrity
- Image hashes prevent duplicate submissions
- Anti-fraud logging and monitoring

## Contributing

This is an MVP implementation. Areas for contribution:
- AI integration for waste classification
- Image storage implementation
- Advanced fraud detection
- Push notifications
- Partner reward integrations
- Performance optimizations

## License

Proprietary - All rights reserved

## Support

For issues or questions, please contact the development team.

---

**JUNXOR** - Turn waste into rewards. Making the world cleaner, one disposal at a time.
