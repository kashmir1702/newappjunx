import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { LeaderboardEntry, LeaderboardTimeWindow } from '../../types/database';
import { Trophy, Medal, Award, Crown } from 'lucide-react-native';

const TIME_WINDOWS: { label: string; value: LeaderboardTimeWindow }[] = [
  { label: 'All Time', value: 'ALL_TIME' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Daily', value: 'DAILY' },
];

export default function LeaderboardScreen() {
  const { profile } = useAuth();
  const [selectedWindow, setSelectedWindow] =
    useState<LeaderboardTimeWindow>('ALL_TIME');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedWindow]);

  const loadLeaderboard = async () => {
    try {
      const data = await api.leaderboard.getLeaderboard(selectedWindow, 100);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => {
    const isCurrentUser = item.user_id === profile?.id;

    return (
      <View
        style={[
          styles.leaderboardCard,
          isCurrentUser && styles.currentUserCard,
        ]}
      >
        <View style={styles.rankContainer}>
          {item.rank <= 3 ? (
            <View style={styles.medalContainer}>
              {item.rank === 1 && <Crown size={24} color="#F59E0B" />}
              {item.rank === 2 && <Medal size={24} color="#9CA3AF" />}
              {item.rank === 3 && <Medal size={24} color="#CD7F32" />}
            </View>
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text
            style={[
              styles.username,
              isCurrentUser && styles.currentUsername,
            ]}
          >
            {item.user_profiles?.username || 'Anonymous'}
            {isCurrentUser && ' (You)'}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Trophy size={16} color="#10B981" />
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>
          Top waste disposal champions
        </Text>
      </View>

      <View style={styles.filterContainer}>
        {TIME_WINDOWS.map((window) => (
          <TouchableOpacity
            key={window.value}
            style={[
              styles.filterButton,
              selectedWindow === window.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedWindow(window.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedWindow === window.value &&
                  styles.filterButtonTextActive,
              ]}
            >
              {window.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Trophy size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Rankings Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to earn JUNX and climb the leaderboard
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
    marginRight: 12,
  },
  medalContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currentUsername: {
    color: '#10B981',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
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
  },
});
