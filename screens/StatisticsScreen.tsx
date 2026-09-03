// screens/StatisticsScreen.tsx
// Two views of progress: an overall "% known" ring across every word,
// and a second ring for whatever custom range you've dragged the
// slider to — defaulting to 1–500. Dragging either handle recomputes
// the second ring for that exact word-rank window.
//
// Only imported (Anki-sourced) words have a defined rank on the 1–6000
// scale (see services/wordRank.ts) — custom user-added words don't
// have a natural position there and are excluded from range stats,
// which is called out below the slider so it's not a silent gap.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VocabWord, SRSStore } from '../types';
import { loadSRSStore } from '../services/storageService';
import { isWordKnown } from '../services/srsEngine';
import { getWordRank } from '../services/wordRank';
import CircularProgress from '../components/CircularProgress';
import RangeSlider from '../components/RangeSlider';
import { ThemeColors } from '../theme/theme';

interface StatisticsScreenProps {
  allWords: VocabWord[];
  colors: ThemeColors;
  bottomInset: number;
}

const MIN_RANK = 1;
const MAX_RANK = 6000;

export default function StatisticsScreen({ allWords, colors, bottomInset }: StatisticsScreenProps) {
  const [srsStore, setSrsStore] = useState<SRSStore>({});
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(500);

  useEffect(() => {
    loadSRSStore().then(setSrsStore);
  }, []);

  const overall = useMemo(() => {
    const total = allWords.length;
    let known = 0;
    for (const w of allWords) {
      if (isWordKnown(srsStore[w.id])) known += 1;
    }
    return { known, total, percent: total > 0 ? (known / total) * 100 : 0 };
  }, [allWords, srsStore]);

  const rangeStats = useMemo(() => {
    let known = 0;
    let total = 0;
    let skippedCustomWords = 0;
    for (const w of allWords) {
      const rank = getWordRank(w);
      if (rank === null) {
        skippedCustomWords += 1;
        continue;
      }
      if (rank < rangeStart || rank > rangeEnd) continue;
      total += 1;
      if (isWordKnown(srsStore[w.id])) known += 1;
    }
    return {
      known,
      total,
      percent: total > 0 ? (known / total) * 100 : 0,
      skippedCustomWords,
    };
  }, [allWords, srsStore, rangeStart, rangeEnd]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Statistics</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
      >
        <View style={styles.ringWrap}>
          <CircularProgress
            percent={overall.percent}
            colors={colors}
            centerLabel={`${Math.round(overall.percent)}%`}
            centerSublabel="known"
          />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {overall.known} of {overall.total} words known overall
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Explore a Range</Text>
        <RangeSlider
          min={MIN_RANK}
          max={MAX_RANK}
          startValue={rangeStart}
          endValue={rangeEnd}
          onChangeEnd={(start, end) => {
            setRangeStart(start);
            setRangeEnd(end);
          }}
          colors={colors}
        />

        <View style={styles.rangeRingWrap}>
          <CircularProgress
            percent={rangeStats.percent}
            size={128}
            strokeWidth={12}
            colors={colors}
            centerLabel={`${Math.round(rangeStats.percent)}%`}
            centerSublabel={`${rangeStats.known}/${rangeStats.total}`}
          />
        </View>

        {rangeStats.skippedCustomWords > 0 ? (
          <Text style={[styles.footnote, { color: colors.textSecondary }]}>
            {rangeStats.skippedCustomWords} custom word
            {rangeStats.skippedCustomWords === 1 ? '' : 's'} you added aren't on the 1–6000 scale, so
            they're not included in this range view.
          </Text>
        ) : null}

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
    marginBottom: 16,
  },
  rangeRingWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  footnote: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
});
