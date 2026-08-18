// screens/AchievementsScreen.tsx
// Persistent tab now, not a Modal overlay.

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS } from '../data/achievements';
import { GamificationState } from '../types';
import { ThemeColors } from '../theme/theme';

interface AchievementsScreenProps {
  gamification: GamificationState;
  colors: ThemeColors;
}

export default function AchievementsScreen({ gamification, colors }: AchievementsScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Achievements</Text>
      </View>
      <FlatList
        data={ACHIEVEMENTS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const unlocked = gamification.unlockedAchievementIds.includes(item.id);
          return (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: unlocked ? 1 : 0.45 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: unlocked ? colors.primary : colors.border },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={26}
                  color={unlocked ? '#FFFFFF' : colors.textSecondary}
                />
              </View>
              <Text style={[styles.badgeTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  row: {
    gap: 12,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  badge: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
});
