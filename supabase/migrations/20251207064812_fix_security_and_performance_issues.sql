/*
  # Fix Security and Performance Issues

  This migration addresses several performance and security concerns:

  ## 1. Missing Foreign Key Indexes
  - Add index on reward_redemptions.reward_id
  - Add index on user_badges.badge_id
  
  These indexes improve JOIN performance and foreign key constraint checks.

  ## 2. RLS Policy Optimization
  Replace `auth.uid()` with `(select auth.uid())` in all policies to prevent
  re-evaluation for each row, significantly improving query performance at scale.

  Affected tables:
  - user_profiles (3 policies)
  - events (2 policies)
  - reward_redemptions (2 policies)
  - user_badges (1 policy)

  ## 3. Function Search Path Security
  Set explicit search_path for update_updated_at_column function to prevent
  search_path injection attacks.

  ## Note on "Unused Indexes"
  The reported unused indexes are expected in a new database. They will be
  utilized once the app is in production with real queries. We're keeping them
  for optimal performance.
*/

-- =============================================
-- ADD MISSING FOREIGN KEY INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id 
  ON reward_redemptions(reward_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id 
  ON user_badges(badge_id);

-- =============================================
-- OPTIMIZE RLS POLICIES
-- =============================================

-- Drop and recreate user_profiles policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Drop and recreate events policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate reward_redemptions policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Users can insert own redemptions" ON reward_redemptions;

CREATE POLICY "Users can view own redemptions"
  ON reward_redemptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON reward_redemptions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate user_badges policy with optimized auth check
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;

CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- =============================================
-- FIX FUNCTION SEARCH PATH
-- =============================================

-- Recreate the function with explicit search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Verify the trigger still exists and works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =============================================
-- VERIFICATION COMMENTS
-- =============================================

COMMENT ON INDEX idx_redemptions_reward_id IS 
  'Foreign key index for performance on reward_redemptions.reward_id';

COMMENT ON INDEX idx_user_badges_badge_id IS 
  'Foreign key index for performance on user_badges.badge_id';

COMMENT ON FUNCTION update_updated_at_column IS 
  'Trigger function with secure search_path to update updated_at timestamp';
