export type EventStatus = 'SUBMITTED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
export type RedemptionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type BadgeType = 'MONTHLY' | 'LIFETIME' | 'CAMPAIGN' | 'INSTITUTION';
export type LeaderboardScope = 'GLOBAL' | 'INSTITUTION';
export type LeaderboardTimeWindow = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export interface UserProfile {
  id: string;
  username: string;
  junx_balance: number;
  device_id: string | null;
  rank: number | null;
  privacy_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  badge_type: BadgeType;
  threshold_config: any;
  active: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  metadata: any;
  badge_definitions?: BadgeDefinition;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  scope: LeaderboardScope;
  time_window: LeaderboardTimeWindow;
  rank: number;
  score: number;
  institution_id: string | null;
  period_start: string;
  period_end: string;
  updated_at: string;
  user_profiles?: UserProfile;
}
