# JUNXOR API Documentation

## Data Contracts

This document defines the data structures and API contracts between the mobile app and server.

## Event Submission

### Client → Server: Submit Event

When a user captures waste photos and submits an event, the app sends:

**Endpoint:** `POST /v1/events` (to be implemented)

**Request Body (multipart/form-data):**

```typescript
// JSON part
{
  "schema_version": "1.0",
  "event_id": "uuid-v4",              // Client-generated for idempotency
  "user_id": "uuid",                  // From auth session
  "device_id": "generated-guid",      // App-generated device ID
  "captured_at": "2024-01-15T10:30:00Z",
  "app_version": "1.0.0",
  "image_hashes": {
    "waste": [
      "sha256:abc123...",              // 1-3 waste image hashes
      "sha256:def456..."
    ],
    "bin": "sha256:ghi789..."          // 1 bin image hash (required)
  },
  "client_claims": {
    "notes": "Optional user notes"
  }
}

// File parts
waste_images[]: File[]  // 1-3 image files
bin_image: File         // 1 image file (required)
```

**Current Implementation:**

The app currently submits events directly to Supabase with image hashes only. To implement full upload:

```typescript
// Example implementation
const formData = new FormData();

// Add JSON metadata
formData.append('metadata', JSON.stringify({
  schema_version: '1.0',
  event_id: draft.event_id,
  user_id: draft.user_id,
  device_id: draft.device_id,
  captured_at: draft.captured_at,
  app_version: draft.app_version,
  image_hashes: {
    waste: draft.waste_images.map(img => img.hash),
    bin: draft.bin_image.hash
  }
}));

// Add waste images
draft.waste_images.forEach((img, index) => {
  formData.append(`waste_images`, {
    uri: img.uri,
    type: 'image/jpeg',
    name: `waste-${index}.jpg`
  });
});

// Add bin image
formData.append('bin_image', {
  uri: draft.bin_image.uri,
  type: 'image/jpeg',
  name: 'bin.jpg'
});

// Submit
const response = await fetch(`${API_URL}/v1/events`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Server → Client: Event Result

After processing, the server returns:

**Response:**

```typescript
{
  "event_id": "uuid",
  "status": "SUBMITTED" | "IN_REVIEW" | "VERIFIED" | "REJECTED",

  // AI classification results
  "ai_result": {
    "subcategory": "plastic_bottle",    // Waste type detected
    "quality": "clean",                  // Cleanliness assessment
    "brand_name": "CocaCola",           // Brand detected (if any)
    "barcode_num": "8690123456789",     // Barcode extracted (if any)
    "barcode_valid": true,              // Barcode validation result
    "misc_info": "500ml PET bottle",    // Human-readable summary
    "roi": [                            // Region of interest (optional)
      {
        "x": 0.1,
        "y": 0.2,
        "w": 0.3,
        "h": 0.4
      }
    ]
  },

  // Reward calculation
  "reward": {
    "junx_awarded": 10,
    "reason": "Clean plastic bottle (rule: clean_plastic_10)"
  },

  // Server signature for audit
  "server_signature": {
    "algo": "Ed25519",
    "value": "base64-encoded-signature"
  },

  // Updated user snapshot
  "user_snapshot": {
    "junx_balance": 120,
    "new_badges": ["badge_id_1"],      // Newly earned badges
    "rank": 42                          // Current leaderboard rank
  }
}
```

## Database Schema

### Tables

#### user_profiles

Extended user information beyond auth.users.

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  junx_balance integer DEFAULT 0,
  device_id text,
  rank integer,
  privacy_consent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### events

Waste disposal event records.

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  event_id uuid UNIQUE NOT NULL,          -- Client-generated
  user_id uuid REFERENCES user_profiles(id),
  status text DEFAULT 'SUBMITTED',        -- SUBMITTED, IN_REVIEW, VERIFIED, REJECTED
  device_id text NOT NULL,
  captured_at timestamptz NOT NULL,
  app_version text NOT NULL,

  -- Image metadata
  waste_image_hashes text[],
  bin_image_hash text NOT NULL,
  waste_image_urls text[],                -- Storage URLs
  bin_image_url text,

  -- AI results
  ai_subcategory text,
  ai_quality text,
  ai_brand_name text,
  ai_barcode_num text,
  ai_barcode_valid boolean,
  ai_misc_info text,
  ai_roi jsonb,

  -- Rewards
  junx_awarded integer DEFAULT 0,
  reward_reason text,

  -- Security
  server_signature text,
  fraud_flags text[],

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```

#### reward_rules

Configurable rules for calculating JUNX rewards.

```sql
CREATE TABLE reward_rules (
  id uuid PRIMARY KEY,
  rule_name text NOT NULL,
  subcategory text,                       -- Waste type (nullable for catch-all)
  quality text,                           -- clean/dirty (nullable for any)
  brand_bonus boolean DEFAULT false,
  junx_amount integer NOT NULL,
  active boolean DEFAULT true,
  priority integer DEFAULT 100,           -- Lower = higher priority
  created_at timestamptz DEFAULT now()
);
```

**Rule Matching Logic:**

```typescript
function calculateReward(aiResult) {
  // Get all active rules sorted by priority
  const rules = await getRules({ active: true, orderBy: 'priority' });

  // Find first matching rule
  for (const rule of rules) {
    if (
      (!rule.subcategory || rule.subcategory === aiResult.subcategory) &&
      (!rule.quality || rule.quality === aiResult.quality)
    ) {
      let junx = rule.junx_amount;

      // Apply brand bonus if detected
      if (rule.brand_bonus && aiResult.brand_name) {
        junx += 5; // Bonus amount
      }

      return {
        junx_awarded: junx,
        reason: rule.rule_name
      };
    }
  }

  // Default fallback
  return { junx_awarded: 1, reason: 'General disposal' };
}
```

#### badge_definitions

Badge types that users can earn.

```sql
CREATE TABLE badge_definitions (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon_url text,
  badge_type text NOT NULL,               -- MONTHLY, LIFETIME, CAMPAIGN, INSTITUTION
  threshold_config jsonb DEFAULT '{}',    -- Configurable rules
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Example threshold_config:**

```json
{
  "events_required": 10,
  "junx_required": 100,
  "clean_recyclables": 50,
  "consecutive_days": 7,
  "rank_required": 10,
  "time_period": "monthly"
}
```

**Badge Awarding Logic:**

```typescript
async function checkBadges(userId: string) {
  const badges = await getAllBadges();
  const userStats = await getUserStats(userId);
  const newBadges = [];

  for (const badge of badges) {
    const config = badge.threshold_config;

    // Check if user already has this badge
    const hasAlreadyEarned = await hasUserBadge(userId, badge.id);
    if (hasAlreadyEarned && badge.badge_type === 'LIFETIME') {
      continue; // Lifetime badges earned only once
    }

    // Check threshold
    let earned = false;
    if (config.events_required && userStats.eventCount >= config.events_required) {
      earned = true;
    }
    if (config.junx_required && userStats.totalJunx >= config.junx_required) {
      earned = true;
    }
    // ... other conditions

    if (earned) {
      await awardBadge(userId, badge.id);
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}
```

#### leaderboard_cache

Cached leaderboard rankings for performance.

```sql
CREATE TABLE leaderboard_cache (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  scope text DEFAULT 'GLOBAL',            -- GLOBAL, INSTITUTION
  time_window text NOT NULL,              -- DAILY, WEEKLY, MONTHLY, ALL_TIME
  rank integer NOT NULL,
  score integer DEFAULT 0,                -- JUNX earned in period
  institution_id uuid,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

**Leaderboard Update Logic:**

```typescript
async function updateLeaderboard(timeWindow: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME') {
  const { start, end } = getPeriod(timeWindow);

  // Calculate scores for all users
  const scores = await db.query(`
    SELECT
      user_id,
      SUM(junx_awarded) as score
    FROM events
    WHERE
      status = 'VERIFIED'
      AND created_at >= $1
      AND created_at < $2
    GROUP BY user_id
    ORDER BY score DESC
  `, [start, end]);

  // Assign ranks
  scores.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Update cache
  await db.transaction(async (tx) => {
    // Clear old entries
    await tx.delete('leaderboard_cache')
      .where('time_window', timeWindow)
      .where('period_start', start);

    // Insert new entries
    await tx.insert('leaderboard_cache').values(
      scores.map(s => ({
        user_id: s.user_id,
        time_window: timeWindow,
        rank: s.rank,
        score: s.score,
        period_start: start,
        period_end: end
      }))
    );
  });
}
```

## Anti-Fraud System

### Duplicate Detection

```typescript
async function checkDuplicates(imageHashes: string[], userId: string) {
  // Check if any hash has been used before
  const duplicates = await db.query(`
    SELECT
      event_id,
      waste_image_hashes,
      bin_image_hash,
      created_at
    FROM events
    WHERE
      user_id = $1
      AND (
        waste_image_hashes && $2::text[]  -- Array overlap
        OR bin_image_hash = ANY($2)
      )
  `, [userId, imageHashes]);

  if (duplicates.length > 0) {
    await logFraud(userId, 'DUPLICATE_HASH', {
      existing_events: duplicates.map(d => d.event_id),
      hashes: imageHashes
    });

    return {
      isDuplicate: true,
      message: 'These images have been submitted before'
    };
  }

  return { isDuplicate: false };
}
```

### Velocity Limits

```typescript
async function checkVelocity(userId: string) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count recent events
  const [hourlyCount, dailyCount] = await Promise.all([
    db.count('events')
      .where('user_id', userId)
      .where('created_at', '>=', oneHourAgo),
    db.count('events')
      .where('user_id', userId)
      .where('created_at', '>=', oneDayAgo)
  ]);

  // Apply limits
  if (hourlyCount >= 5) {
    await logFraud(userId, 'VELOCITY_LIMIT', {
      limit: 'hourly',
      count: hourlyCount
    });
    return {
      exceeded: true,
      message: 'Too many submissions in the last hour. Please try again later.'
    };
  }

  if (dailyCount >= 50) {
    await logFraud(userId, 'VELOCITY_LIMIT', {
      limit: 'daily',
      count: dailyCount
    });
    return {
      exceeded: true,
      message: 'Daily limit reached. Try again tomorrow.'
    };
  }

  return { exceeded: false };
}
```

### Suspicious Pattern Detection

```typescript
async function detectPatterns(userId: string) {
  // Check for repeated patterns
  const recentEvents = await getRecentEvents(userId, 10);

  // All events at exact same location (if GPS implemented)
  // All events at exact same time of day
  // Identical image dimensions/metadata
  // Extremely fast submissions

  const suspicious = analyzeSuspiciousPatterns(recentEvents);

  if (suspicious.score > 0.8) {
    await logFraud(userId, 'SUSPICIOUS_PATTERN', {
      patterns: suspicious.detected,
      score: suspicious.score
    });

    return {
      suspicious: true,
      action: 'MANUAL_REVIEW'  // Flag for admin review
    };
  }

  return { suspicious: false };
}
```

## Server Implementation Checklist

### Phase 1: Basic API
- [ ] Set up API server (Node.js/Express, Deno, etc.)
- [ ] Implement authentication middleware
- [ ] Create event submission endpoint
- [ ] Implement image storage (Supabase Storage)
- [ ] Add basic validation

### Phase 2: AI Integration
- [ ] Set up AI service (OpenAI Vision, Google Cloud Vision, custom)
- [ ] Implement waste classification
- [ ] Add barcode/OCR extraction
- [ ] Create AI result storage

### Phase 3: Fraud Prevention
- [ ] Implement duplicate hash checking
- [ ] Add velocity limits
- [ ] Create pattern detection
- [ ] Set up admin review queue

### Phase 4: Rewards & Gamification
- [ ] Implement reward calculation engine
- [ ] Add badge awarding logic
- [ ] Create leaderboard update system
- [ ] Add scheduled jobs for periodic updates

### Phase 5: Advanced Features
- [ ] Push notifications
- [ ] Partner integrations
- [ ] Institution/organization support
- [ ] Analytics dashboard

## Testing

### Test Events

Create test events with known data:

```typescript
const testEvent = {
  event_id: '00000000-0000-0000-0000-000000000001',
  user_id: testUserId,
  device_id: 'test-device',
  captured_at: new Date().toISOString(),
  app_version: '1.0.0-test',
  waste_image_hashes: ['test-hash-1'],
  bin_image_hash: 'test-hash-bin',
  ai_subcategory: 'plastic_bottle',
  ai_quality: 'clean',
  status: 'VERIFIED',
  junx_awarded: 10
};
```

### Test Scenarios

1. **Normal Flow**: Submit event, verify AI processing, check reward
2. **Duplicate Detection**: Submit same images twice
3. **Velocity Limits**: Submit many events rapidly
4. **Badge Awards**: Trigger threshold events
5. **Leaderboard Update**: Submit events and check ranking
6. **Reward Redemption**: Earn JUNX and redeem rewards

## Security Considerations

1. **Image Storage**: Use signed URLs with expiration
2. **Rate Limiting**: Implement at API gateway level
3. **Input Validation**: Validate all inputs server-side
4. **SQL Injection**: Use parameterized queries
5. **RLS Policies**: Verify Supabase RLS is enabled
6. **Token Security**: Use short-lived tokens with refresh
7. **Audit Logging**: Log all sensitive operations
8. **Server Signatures**: Sign finalized events for audit trail

## Future Enhancements

- GraphQL API for flexible querying
- Real-time updates via WebSockets
- Batch processing for AI efficiency
- CDN for image delivery
- Multi-region deployment
- Advanced analytics and reporting
