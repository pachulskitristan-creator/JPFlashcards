// components/TagEditorModal.tsx
// Opened from the quiz card's tag button. Lets the user add free-form
// tags to the current word (e.g. "Food & Restaurants") — these feed
// directly into the Home screen's "Travel Topics" filter, and remove
// tags they previously added.

import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/theme';

interface TagEditorModalProps {
  visible: boolean;
  onClose: () => void;
  wordLabel: string;
  currentTags: string[];
  suggestions: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  colors: ThemeColors;
}

export default function TagEditorModal({
  visible,
  onClose,
  wordLabel,
  currentTags,
  suggestions,
  onAddTag,
  onRemoveTag,
  colors,
}: TagEditorModalProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      onAddTag(input.trim());
      setInput('');
    }
  };

  const unusedSuggestions = suggestions.filter(
    (s) => !currentTags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              Tags for {wordLabel}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary }]}
              placeholder="Add a tag…"
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAdd}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {currentTags.length > 0 ? (
            <View style={styles.chipWrap}>
              {currentTags.map((tag) => (
                <View key={tag} style={[styles.chip, { backgroundColor: colors.primary }]}>
                  <Text style={styles.chipText}>{tag}</Text>
                  <Pressable onPress={() => onRemoveTag(tag)} hitSlop={6}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noTags, { color: colors.textSecondary }]}>No tags yet.</Text>
          )}

          {unusedSuggestions.length > 0 ? (
            <>
              <Text style={[styles.suggestLabel, { color: colors.textSecondary }]}>Quick add</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipWrap}>
                  {unusedSuggestions.slice(0, 12).map((tag) => (
                    <Pressable
                      key={tag}
                      style={[styles.suggestChip, { backgroundColor: colors.card }]}
                      onPress={() => onAddTag(tag)}
                    >
                      <Text style={[styles.suggestChipText, { color: colors.textSecondary }]}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,15,25,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 22,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noTags: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  suggestLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 6,
  },
  suggestChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
  },
  suggestChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
