// screens/VaultScreen.tsx
// Tags and Achievements merged into one tab — "Vault" — switched via a
// segmented control at the top instead of two separate bottom-bar
// tabs. Each sub-view keeps its own internal logic (tag drill-down,
// achievement grid) verbatim; this just owns the shared header/
// background and which one is currently showing.

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS } from '../data/achievements';
import { GamificationState, UserTagStore, VocabWord } from '../types';
import { getTagCounts, getWordsForTag, removeTagEverywhere, removeTagFromWord } from '../services/tagsService';
import { speakJapanese } from '../services/ttsService';
import SwipeToDeleteRow from '../components/SwipeToDeleteRow';
import PatternBackground from '../components/PatternBackground';
import { ThemeColors } from '../theme/theme';

interface VaultScreenProps {
  allWords: VocabWord[];
  userTags: UserTagStore;
  onTagsChanged: (next: UserTagStore) => void;
  gamification: GamificationState;
  colors: ThemeColors;
  bottomInset: number;
}

type VaultSection = 'tags' | 'awards';

export default function VaultScreen({
  allWords,
  userTags,
  onTagsChanged,
  gamification,
  colors,
  bottomInset,
}: VaultScreenProps) {
  const [section, setSection] = useState<VaultSection>('tags');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tagCounts = React.useMemo(() => getTagCounts(allWords, userTags), [allWords, userTags]);
  const wordsForTag = React.useMemo(
    () => (selectedTag ? getWordsForTag(selectedTag, allWords, userTags) : []),
    [selectedTag, allWords, userTags]
  );
  const unlockedCount = gamification.unlockedAchievementIds.length;

  const handleDeleteTag = async (tag: string) => {
    const updated = await removeTagEverywhere(tag, allWords);
    onTagsChanged(updated);
    if (selectedTag === tag) setSelectedTag(null);
  };

  const handleRemoveWordTag = async (wordId: string, tag: string) => {
    const updated = await removeTagFromWord(wordId, tag);
    onTagsChanged(updated);
  };

  const selectSection = (next: VaultSection) => {
    setSelectedTag(null);
    setSection(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} fadeColor={colors.background} />
      <View style={styles.header}>
        {selectedTag ? (
          <Pressable style={styles.backRow} onPress={() => setSelectedTag(null)}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {selectedTag}
            </Text>
          </Pressable>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Vault</Text>
            {section === 'awards' ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {unlockedCount} / {ACHIEVEMENTS.length} unlocked
              </Text>
            ) : null}
          </>
        )}
      </View>

      {!selectedTag ? (
        <View style={styles.sectionSwitch}>
          {(['tags', 'awards'] as VaultSection[]).map((key) => {
            const active = section === key;
            return (
              <Pressable
                key={key}
                style={[styles.sectionOption, { backgroundColor: active ? colors.primary : `${colors.card}A6` }]}
                onPress={() => selectSection(key)}
              >
                <Ionicons
                  name={key === 'tags' ? 'folder' : 'trophy'}
                  size={16}
                  color={active ? '#FFFFFF' : colors.textPrimary}
                />
                <Text style={[styles.sectionOptionText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>
                  {key === 'tags' ? 'Tags' : 'Awards'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {section === 'tags' ? (
        !selectedTag ? (
          <FlatList
            key="tags-list"
            data={tagCounts}
            keyExtractor={(item) => item.tag}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
            renderItem={({ item }) => (
              <SwipeToDeleteRow
                onDelete={() => handleDeleteTag(item.tag)}
                onPress={() => setSelectedTag(item.tag)}
                colors={colors}
              >
                <View style={[styles.folderRow, { backgroundColor: `${colors.surfaceAlt}A6` }]}>
                  <View style={[styles.folderIcon, { backgroundColor: colors.card }]}>
                    <Ionicons name="folder" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.folderLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.tag}
                  </Text>
                  <Text style={[styles.folderCount, { color: colors.textSecondary }]}>{item.count}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </SwipeToDeleteRow>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No tagged words yet — tag words during a quiz and they'll show up here.
              </Text>
            }
          />
        ) : (
          <FlatList
            key="words-list"
            data={wordsForTag}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
            renderItem={({ item }) => (
              <View style={styles.wordRowOuter}>
                <SwipeToDeleteRow onDelete={() => handleRemoveWordTag(item.id, selectedTag)} colors={colors}>
                  <View style={[styles.wordRow, { backgroundColor: `${colors.surfaceAlt}A6` }]}>
                    <Text style={[styles.wordJapanese, { color: colors.textPrimary }]}>{item.japanese}</Text>
                    <Text style={[styles.wordSub, { color: colors.textSecondary }]}>
                      {item.romaji} · {item.english}
                    </Text>
                  </View>
                </SwipeToDeleteRow>
                <Pressable
                  style={[styles.speakerButton, { backgroundColor: `${colors.surfaceAlt}A6` }]}
                  onPress={() => speakJapanese(item.japanese)}
                  hitSlop={8}
                >
                  <Ionicons name="volume-high" size={20} color={colors.primary} />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No words left in this tag.</Text>
            }
          />
        )
      ) : (
        <FlatList
          key="awards-grid"
          data={ACHIEVEMENTS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset }]}
          renderItem={({ item }) => {
            const unlocked = gamification.unlockedAchievementIds.includes(item.id);
            return (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: unlocked ? 1 : 0.45 },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: unlocked ? colors.success : colors.border }]}>
                  <Ionicons name={item.icon as any} size={26} color={unlocked ? '#FFFFFF' : colors.textSecondary} />
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
      )}
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
    marginBottom: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionSwitch: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sectionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sectionOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 30,
  },
  row: {
    gap: 12,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  folderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  folderCount: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
  wordRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  wordRow: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  speakerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wordJapanese: {
    fontSize: 17,
    fontWeight: '600',
  },
  wordSub: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 20,
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
