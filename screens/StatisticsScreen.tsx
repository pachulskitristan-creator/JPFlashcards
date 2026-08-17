// screens/StatisticsScreen.tsx
// Overall "% known" as a circular ring (the headline stat), plus a
// per-Vocabulary-Range breakdown below as simple bars.

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VocabWord, SRSStore, getAllTiers, getTierLabel } from '../types';
import { loadSRSStore } from '../services/storageService';
import { isWordKnown } from '../services/srsEngine';
import CircularProgress from '../components/CircularProgress';
import PercentBar from '../components/PercentBar';
import { ThemeColors } from '../theme/theme';

interface StatisticsScreenProps {
  visible: boolean;
  onClose: () => void;
  allWords: VocabWord[];
  colors: ThemeColors;
}

export default function StatisticsScreen({ visible, onClose, allWords, colors }: StatisticsScreenProps) {
  const [srsStore, setSrsStore] = useState<SRSStore>({});

  useEffect(() => {
    if (visible) {
      loadSRSStore().then(setSrsStore);
    }
  }, [visible]);

  const { overallPercent, perTier, knownCount, totalCount } = useMemo(() => {
    const total = allWords.length;
    let known = 0;
    const byTier: Record<number, { known: number; total: number }> = {};

    for (const w of allWords) {
      const data = srsStore[w.id];
      const wordKnown = isWordKnown(data);
      if (wordKnown) known += 1;

      if (!byTier[w.tier]) byTier[w.tier] = { known: 0, total: 0 };
      byTier[w.tier].total += 1;
      if (wordKnown) byTier[w.tier].known += 1;
    }

    return {
      overallPercent: total > 0 ? (known / total) * 100 : 0,
      perTier: byTier,
      knownCount: known,
      totalCount: total,
    };
  }, [allWords, srsStore]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Statistics</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.ringWrap}>
            <CircularProgress
              percent={overallPercent}
              colors={colors}
              centerLabel={`${Math.round(overallPercent)}%`}
              centerSublabel="known"
            />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {knownCount} of {totalCount} words known
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>By Vocabulary Range</Text>
          {getAllTiers().map((tier) => {
            const stats = perTier[tier];
            if (!stats || stats.total === 0) return null;
            return (
              <PercentBar
                key={tier}
                label={getTierLabel(tier)}
                percent={(stats.known / stats.total) * 100}
                colors={colors}
              />
            );
          })}

          <Text style={[styles.footnote, { color: colors.textSecondary }]}>
            A word counts as "known" once you've answered it correctly 10 times in a row, or you've
            marked it "I know this" during a quiz.
          </Text>
        </ScrollView>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: 30,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  footnote: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 17,
  },
});
