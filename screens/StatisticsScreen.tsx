// screens/StatisticsScreen.tsx
// Now a persistent tab (no Modal/visible/onClose) instead of an
// overlay. Shows the overall "% known" ring, then a "2 dots on a
// line" progress row for each Vocabulary Range the user currently has
// selected on the Home tab — falls back to showing every range with
// any data if none are selected, so it's never just blank.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VocabWord, SRSStore, FrequencyTier, getAllTiers, getTierLabel } from '../types';
import { loadSRSStore } from '../services/storageService';
import { isWordKnown } from '../services/srsEngine';
import CircularProgress from '../components/CircularProgress';
import RangeProgressLine from '../components/RangeProgressLine';
import { ThemeColors } from '../theme/theme';

interface StatisticsScreenProps {
  allWords: VocabWord[];
  selectedTiers: FrequencyTier[];
  colors: ThemeColors;
}

export default function StatisticsScreen({ allWords, selectedTiers, colors }: StatisticsScreenProps) {
  const [srsStore, setSrsStore] = useState<SRSStore>({});

  useEffect(() => {
    loadSRSStore().then(setSrsStore);
  }, []);

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

  const tiersToShow = useMemo(() => {
    if (selectedTiers.length > 0) return selectedTiers.slice().sort((a, b) => a - b);
    return getAllTiers().filter((t) => perTier[t] && perTier[t].total > 0);
  }, [selectedTiers, perTier]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Statistics</Text>
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

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {selectedTiers.length > 0 ? 'Your Selected Ranges' : 'By Vocabulary Range'}
        </Text>
        {tiersToShow.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No range data yet — study a few cards first.
          </Text>
        ) : (
          tiersToShow.map((tier) => {
            const stats = perTier[tier];
            if (!stats || stats.total === 0) return null;
            return (
              <RangeProgressLine
                key={tier}
                label={getTierLabel(tier)}
                knownCount={stats.known}
                totalCount={stats.total}
                colors={colors}
              />
            );
          })
        )}

        <Text style={[styles.footnote, { color: colors.textSecondary }]}>
          A word counts as "known" once you've answered it correctly 10 times in a row, or you've
          marked it "I know this" during a quiz.
        </Text>
      </ScrollView>
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
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  footnote: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 17,
  },
});
