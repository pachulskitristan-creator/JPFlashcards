// screens/TaggedWordsScreen.tsx
// Persistent tab, not a Modal overlay. Two levels: folder list of tags,
// drill into a tag to see its words. Swipe left on a folder to delete
// that tag everywhere; swipe left on a word (inside a folder) to
// remove just that word's tag.

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserTagStore, VocabWord } from '../types';
import { getTagCounts, getWordsForTag, removeTagEverywhere, removeTagFromWord } from '../services/tagsService';
import { speakJapanese } from '../services/ttsService';
import SwipeToDeleteRow from '../components/SwipeToDeleteRow';
import { ThemeColors } from '../theme/theme';

interface TaggedWordsScreenProps {
  allWords: VocabWord[];
  userTags: UserTagStore;
  onTagsChanged: (next: UserTagStore) => void;
  colors: ThemeColors;
}

export default function TaggedWordsScreen({
  allWords,
  userTags,
  onTagsChanged,
  colors,
}: TaggedWordsScreenProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tagCounts = useMemo(() => getTagCounts(allWords, userTags), [allWords, userTags]);
  const wordsForTag = useMemo(
    () => (selectedTag ? getWordsForTag(selectedTag, allWords, userTags) : []),
    [selectedTag, allWords, userTags]
  );

  const handleDeleteTag = async (tag: string) => {
    const updated = await removeTagEverywhere(tag, allWords);
    onTagsChanged(updated);
    if (selectedTag === tag) setSelectedTag(null);
  };

  const handleRemoveWordTag = async (wordId: string, tag: string) => {
    const updated = await removeTagFromWord(wordId, tag);
    onTagsChanged(updated);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {selectedTag ? (
          <Pressable style={styles.backRow} onPress={() => setSelectedTag(null)}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {selectedTag}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.title, { color: colors.textPrimary }]}>Tagged Words</Text>
        )}
      </View>

      {!selectedTag ? (
        <FlatList
          data={tagCounts}
          keyExtractor={(item) => item.tag}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SwipeToDeleteRow
              onDelete={() => handleDeleteTag(item.tag)}
              onPress={() => setSelectedTag(item.tag)}
              colors={colors}
            >
              <View style={[styles.folderRow, { backgroundColor: colors.surfaceAlt }]}>
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
          data={wordsForTag}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.wordRowOuter}>
              <SwipeToDeleteRow
                onDelete={() => handleRemoveWordTag(item.id, selectedTag)}
                colors={colors}
              >
                <View style={[styles.wordRow, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.wordJapanese, { color: colors.textPrimary }]}>{item.japanese}</Text>
                  <Text style={[styles.wordSub, { color: colors.textSecondary }]}>
                    {item.romaji} · {item.english}
                  </Text>
                </View>
              </SwipeToDeleteRow>
              <Pressable
                style={[styles.speakerButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => speakJapanese(item.japanese)}
                hitSlop={8}
              >
                <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No words left in this tag.
            </Text>
          }
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
    marginBottom: 20,
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
  listContent: {
    paddingBottom: 30,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
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
  },
  speakerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
});
