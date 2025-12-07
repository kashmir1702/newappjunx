import { supabase } from './supabase';
import {
  UserProfile,
  UserBadge,
  BadgeDefinition,
  LeaderboardEntry,
  LeaderboardTimeWindow,
} from '@/types/database';

export const api = {
  auth: {
    async getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  },

  profile: {
    async getProfile(userId: string): Promise<UserProfile | null> {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    async updateProfile(
      userId: string,
      updates: Partial<UserProfile>
    ): Promise<UserProfile> {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },

  badges: {
    async getUserBadges(userId: string): Promise<UserBadge[]> {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge_definitions(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    async getAllBadges(): Promise<BadgeDefinition[]> {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      return data || [];
    },
  },

  leaderboard: {
    async getLeaderboard(
      timeWindow: LeaderboardTimeWindow = 'ALL_TIME',
      limit: number = 100
    ): Promise<LeaderboardEntry[]> {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*, user_profiles(username)')
        .eq('scope', 'GLOBAL')
        .eq('time_window', timeWindow)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  },
};
