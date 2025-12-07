import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { UserBadge } from '../../types/database';
import { Award, Calendar } from 'lucide-react-native';

export default function BadgesScreen() {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [profile]);

  const loadBadges = async () => {
    if (!profile) return;

    try {
      const data = await api.badges.getUserBadges(profile.id);
      setBadges(data);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBadges();
    setRefreshing(false);
  };

  const renderBadgeItem = ({ item }: { item: UserBadge }) => (
    <View style={styles.badgeCard}>
      <View style={styles.badgeIconContainer}>
        <Award size={40} color="#10B981" />
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>
          {item.badge_definitions?.name || 'Badge'}
        </Text>
        {item.badge_definitions?.description && (
          <Text style={styles.badgeDescription}>
            {item.badge_definitions.description}
          </Text>
        )}
        <View style={styles.badgeFooter}>
          <View style={styles.badgeTypeTag}>
            <Text style={styles.badgeTypeText}>
              {item.badge_definitions?.badge_type || 'BADGE'}
            </Text>
          </View>
          <View style={styles.badgeDateContainer}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.badgeDate}>
              {new Date(item.earned_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Badges</Text>
        <Text style={styles.headerSubtitle}>
          {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
        </Text>
      </View>

      {badges.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Award size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Badges Yet</Text>
          <Text style={styles.emptyText}>
            Keep disposing waste responsibly to earn badges and achievements
          </Text>
        </View>
      ) : (
        <FlatList
          data={badges}
          renderItem={renderBadgeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  badgeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTypeTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  badgeDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
