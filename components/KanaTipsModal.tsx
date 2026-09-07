// components/KanaTipsModal.tsx
// Reference sheet for the small kana (っ, ゃゅょ, ぁぃぅぇぉ) that look
// almost identical to their full-size counterparts at small font
// sizes — exactly the kind of thing that causes a "correct" answer to
// get marked wrong when the small-kana toggle got missed. Shows each
// pair at a size that actually demonstrates the size difference, plus
// how to type the small form on both kana and romaji keyboards.

import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/theme';

interface KanaTipsModalProps {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}

interface KanaTip {
  regular: string;
  small: string;
  label: string;
  kanaHowTo: string;
  romajiHowTo: string;
}

const TIPS: KanaTip[] = [
  {
    regular: 'つ',
    small: 'っ',
    label: 'Small tsu — sokuon (also ッ in katakana)',
    kanaHowTo: 'Type つ, then tap the key above.',
    romajiHowTo: 'Double the next consonant — "kk", "pp", "ss", "tt" (e.g. "suppai" → すっぱい) — or type "xtu"/"ltu" for it alone.',
  },
  {
    regular: 'や',
    small: 'ゃ',
    label: 'Small ya (also ャ in katakana)',
    kanaHowTo: 'Type や, then tap the key above.',
    romajiHowTo: 'Consonant + "ya", e.g. "kya", "sha", "cha", "nya".',
  },
  {
    regular: 'ゆ',
    small: 'ゅ',
    label: 'Small yu (also ュ in katakana)',
    kanaHowTo: 'Type ゆ, then tap the key above.',
    romajiHowTo: 'Consonant + "yu", e.g. "shu", "ryu".',
  },
  {
    regular: 'よ',
    small: 'ょ',
    label: 'Small yo (also ョ in katakana)',
    kanaHowTo: 'Type よ, then tap the key above.',
    romajiHowTo: 'Consonant + "yo", e.g. "hyo", "jo".',
  },
  {
    regular: 'あ',
    small: 'ぁ',
    label: 'Small vowels — ぁぃぅぇぉ (also ァィゥェォ)',
    kanaHowTo: 'Type the full-size vowel, then tap the key above. Mostly used in loanwords, e.g. ファ, ティ, ウィ.',
    romajiHowTo: 'Type the combo directly, e.g. "fa", "ti", "wi".',
  },
];

/** The actual small-kana toggle key most Japanese kana keyboards have — shown as a mini keycap so it's recognizable at a glance, not just described. Drawn as a real dark keycap regardless of app theme, since it's depicting the OS keyboard, not app UI. */
function ToggleKeyCap() {
  return (
    <View style={[styles.keycap, { backgroundColor: '#3A3A3C', borderColor: '#57575A' }]}>
      <Text style={styles.keycapTop}>゛゜</Text>
      <Text style={styles.keycapBottom}>小</Text>
    </View>
  );
}

export default function KanaTipsModal({ visible, onClose, colors }: KanaTipsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Small Kana</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            These characters look almost the same as their full-size version at small sizes — easy to miss the
            toggle and end up with the wrong one.
          </Text>

          <View style={[styles.keyCallout, { backgroundColor: colors.surfaceAlt }]}>
            <ToggleKeyCap />
            <Text style={[styles.keyCalloutText, { color: colors.textPrimary }]}>
              On a kana keyboard, look for this key — it converts whatever you just typed to its small form (and
              back again if you tap it twice).
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {TIPS.map((tip) => (
              <View key={tip.label} style={[styles.row, { backgroundColor: colors.surfaceAlt }]}>
                <View style={styles.compare}>
                  <Text style={[styles.regularChar, { color: colors.textPrimary }]}>{tip.regular}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                  <Text style={[styles.smallChar, { color: colors.primary }]}>{tip.small}</Text>
                </View>
                <Text style={[styles.label, { color: colors.textPrimary }]}>{tip.label}</Text>
                <Text style={[styles.howTo, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '700' }}>Kana keyboard: </Text>
                  {tip.kanaHowTo}
                </Text>
                <Text style={[styles.howTo, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '700' }}>Romaji keyboard: </Text>
                  {tip.romajiHowTo}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,15,25,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  intro: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  keyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  keycap: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  keycapTop: {
    color: '#D8D8DC',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
  keycapBottom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 19,
  },
  keyCalloutText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  scrollArea: {
    marginTop: 4,
  },
  row: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  compare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  regularChar: {
    fontSize: 32,
    fontWeight: '700',
  },
  smallChar: {
    fontSize: 32,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  howTo: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
