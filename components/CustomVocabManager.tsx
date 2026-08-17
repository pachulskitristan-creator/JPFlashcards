// components/CustomVocabManager.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VocabWord } from '../types';
import { addCustomWord, deleteCustomWord, loadCustomVocab } from '../services/storageService';
import { ThemeColors } from '../theme/theme';

interface CustomVocabManagerProps {
  visible: boolean;
  onClose: () => void;
  onChanged: (words: VocabWord[]) => void;
  colors: ThemeColors;
}

export default function CustomVocabManager({ visible, onClose, onChanged, colors }: CustomVocabManagerProps) {
  const [english, setEnglish] = useState('');
  const [japanese, setJapanese] = useState('');
  const [romaji, setRomaji] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customWords, setCustomWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    if (visible) {
      loadCustomVocab().then(setCustomWords);
    }
  }, [visible]);

  const resetForm = () => {
    setEnglish('');
    setJapanese('');
    setRomaji('');
    setTagInput('');
    setTags([]);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim();
    if (clean && !tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleSave = async () => {
    if (!english.trim() || !japanese.trim() || !romaji.trim()) return;

    const newWord: VocabWord = {
      id: `custom_${Date.now()}`,
      english: english.trim(),
      japanese: japanese.trim(),
      romaji: romaji.trim(),
      tier: 1,
      categories: tags,
      isCustom: true,
    };

    const updated = await addCustomWord(newWord);
    setCustomWords(updated);
    onChanged(updated);
    resetForm();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteCustomWord(id);
    setCustomWords(updated);
    onChanged(updated);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>My Vocabulary</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="English"
            placeholderTextColor={colors.textSecondary}
            value={english}
            onChangeText={setEnglish}
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary }]}
          />
          <TextInput
            placeholder="Japanese (Kanji/Kana)"
            placeholderTextColor={colors.textSecondary}
            value={japanese}
            onChangeText={setJapanese}
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary }]}
          />
          <TextInput
            placeholder="Romaji"
            placeholderTextColor={colors.textSecondary}
            value={romaji}
            onChangeText={setRomaji}
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary }]}
          />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tags (optional)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              placeholder="e.g. Food & Restaurants"
              placeholderTextColor={colors.textSecondary}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              style={[styles.input, styles.tagInput, { backgroundColor: colors.card, color: colors.textPrimary }]}
            />
            <Pressable style={[styles.tagAddButton, { backgroundColor: colors.primary }]} onPress={handleAddTag}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagChipWrap}>
              {tags.map((tag) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <Pressable onPress={() => setTags((prev) => prev.filter((t) => t !== tag))} hitSlop={6}>
                    <Ionicons name="close" size={13} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add Card</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Your Cards ({customWords.length})
        </Text>
        <FlatList
          data={customWords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={[styles.wordRow, { backgroundColor: colors.surfaceAlt }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.wordJapanese, { color: colors.textPrimary }]}>{item.japanese}</Text>
                <Text style={[styles.wordSub, { color: colors.textSecondary }]}>
                  {item.romaji} · {item.english}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No custom cards yet — add one above.
            </Text>
          }
        />
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    marginBottom: 0,
  },
  tagAddButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  tagChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginTop: 20,
  },
});
