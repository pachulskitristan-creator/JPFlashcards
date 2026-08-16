// components/CustomVocabManager.tsx
// Lets the user add their own English / Japanese / Romaji cards.
// Entries are persisted and merged into the main vocab pool by the
// caller (see App.tsx), so they show up in quizzes automatically.

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
import { ALL_CATEGORIES, TravelCategory, VocabWord } from '../types';
import { addCustomWord, deleteCustomWord, loadCustomVocab } from '../services/storageService';
import CategoryFilter from './CategoryFilter';

interface CustomVocabManagerProps {
  visible: boolean;
  onClose: () => void;
  onChanged: (words: VocabWord[]) => void; // called whenever the custom list changes
}

export default function CustomVocabManager({ visible, onClose, onChanged }: CustomVocabManagerProps) {
  const [english, setEnglish] = useState('');
  const [japanese, setJapanese] = useState('');
  const [romaji, setRomaji] = useState('');
  const [category, setCategory] = useState<TravelCategory>('Greetings & Essentials');
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
  };

  const handleSave = async () => {
    if (!english.trim() || !japanese.trim() || !romaji.trim()) return;

    const newWord: VocabWord = {
      id: `custom_${Date.now()}`,
      english: english.trim(),
      japanese: japanese.trim(),
      romaji: romaji.trim(),
      tier: 1,
      categories: [category],
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Vocabulary</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color="#8B85B8" />
          </Pressable>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="English"
            placeholderTextColor="#B3AEDB"
            value={english}
            onChangeText={setEnglish}
            style={styles.input}
          />
          <TextInput
            placeholder="Japanese (Kanji/Kana)"
            placeholderTextColor="#B3AEDB"
            value={japanese}
            onChangeText={setJapanese}
            style={styles.input}
          />
          <TextInput
            placeholder="Romaji"
            placeholderTextColor="#B3AEDB"
            value={romaji}
            onChangeText={setRomaji}
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Category</Text>
          <CategoryFilter
            options={ALL_CATEGORIES.map((c) => ({ key: c, label: c }))}
            selectedKeys={[category]}
            onToggle={(key) => setCategory(key as TravelCategory)}
          />

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add Card</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Your Cards ({customWords.length})</Text>
        <FlatList
          data={customWords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.wordRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wordJapanese}>{item.japanese}</Text>
                <Text style={styles.wordSub}>
                  {item.romaji} · {item.english}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color="#F3A6A6" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No custom cards yet — add one above.</Text>
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFBFF',
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
    color: '#2B2B36',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F4F2FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2B2B36',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B85B8',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#5A4FCF',
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
    backgroundColor: '#F9F8FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  wordJapanese: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2B2B36',
  },
  wordSub: {
    fontSize: 13,
    color: '#8B85B8',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#B3AEDB',
    textAlign: 'center',
    marginTop: 20,
  },
});
