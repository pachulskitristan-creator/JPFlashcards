// screens/TaggedWordsScreen.tsx
// Two-level view: a folder list of tags (with word counts), tap one to
// drill into the actual words carrying that tag. Gives quick access to
// whatever the user has been tagging during quizzes.

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserTagStore, VocabWord } from '../types';
import { getTagCounts, getWordsForTag } from '../services/tagsService';
import { speakJapanese } from '../services/ttsService';
import { ThemeColors } from '../theme/theme';

interface TaggedWordsScreenProps {
  visible: boolean;
  onClose: () => void;
  allWords: VocabWord[];
  userTags: UserTagStore;
  colors: ThemeColors;
}

export default function TaggedWordsScreen({
  visible,
  onClose,
  allWords,
  userTags,
  colors,
}: TaggedWordsScreenProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) setSelectedTag(null);
  }, [visible]);

  const tagCounts = useMemo(() => getTagCounts(allWords, userTags), [allWords, userTags]);
  const wordsForTag = useMemo(
    () => (selectedTag ? getWordsForTag(selectedTag, allWords, userTags) : []),
    [selectedTag, allWords, userTags]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        {!selectedTag ? (
          <FlatList
            data={tagCounts}
            keyExtractor={(item) => item.tag}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.folderRow, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setSelectedTag(item.tag)}
              >
                <View style={[styles.folderIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="folder" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.folderLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.tag}
                </Text>
                <Text style={[styles.folderCount, { color: colors.textSecondary }]}>{item.count}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
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
              <View style={[styles.wordRow, { backgroundColor: colors.surfaceAlt }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.wordJapanese, { color: colors.textPrimary }]}>{item.japanese}</Text>
                  <Text style={[styles.wordSub, { color: colors.textSecondary }]}>
                    {item.romaji} · {item.english}
                  </Text>
                </View>
                <Pressable onPress={() => speakJapanese(item.japanese)} hitSlop={8}>
                  <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 12,
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
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
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
