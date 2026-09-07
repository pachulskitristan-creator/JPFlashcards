// screens/StatisticsScreen.tsx
// Two views of progress:
//   1. Overall composition — known / kind-of-know ("learning") / new —
//      as one segmented bar plus the raw counts, not three separate
//      rings (a stacked bar reads a 3-part whole faster than rings do).
//   2. The selected rank range (via the slider) broken into buckets and
//      plotted as two overlapping smooth curves — % known and % kind-of-
//      know across that range — instead of a flat single percentage.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VocabWord, SRSStore } from '../types';
import { loadSRSStore } from '../services/storageService';
import { isWordKnown } from '../services/srsEngine';
import { getWordRank } from '../services/wordRank';
import RangeSlider from '../components/RangeSlider';
import MasteryWaveChart, { WaveBucket } from '../components/MasteryWaveChart';
import PatternBackground from '../components/PatternBackground';
import { ThemeColors } from '../theme/theme';

interface StatisticsScreenProps {
  allWords: VocabWord[];
  colors: ThemeColors;
  bottomInset: number;
}

const MIN_RANK = 1;
const MAX_RANK = 6000;
const BUCKET_COUNT = 6;

interface Bucket {
  known: number;
  learning: number;
  total: number;
}

function bucketOf(words: VocabWord[], srsStore: SRSStore): Bucket {
  let known = 0;
  let learning = 0;
  for (const w of words) {
    const data = srsStore[w.id];
    if (isWordKnown(data)) known += 1;
    else if (data && data.correctCount > 0) learning += 1;
  }
  return { known, learning, total: words.length };
}

export default function StatisticsScreen({ allWords, colors, bottomInset }: StatisticsScreenProps) {
  const [srsStore, setSrsStore] = useState<SRSStore>({});
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(500);

  useEffect(() => {
    loadSRSStore().then(setSrsStore);
  }, []);

  const overall = useMemo(() => bucketOf(allWords, srsStore), [allWords, srsStore]);

  const rankedWords = useMemo(
    () => allWords.map((w) => ({ word: w, rank: getWordRank(w) })).filter((x) => x.rank !== null) as {
      word: VocabWord;
      rank: number;
    }[],
    [allWords]
  );
  const skippedCustomWords = allWords.length - rankedWords.length;

  const waveBuckets: WaveBucket[] = useMemo(() => {
    const span = Math.max(1, rangeEnd - rangeStart + 1);
    const bucketSize = span / BUCKET_COUNT;
    const buckets: WaveBucket[] = [];
    for (let i = 0; i < BUCKET_COUNT; i++) {
      const lo = Math.round(rangeStart + i * bucketSize);
      const hi = i === BUCKET_COUNT - 1 ? rangeEnd : Math.round(rangeStart + (i + 1) * bucketSize) - 1;
      const wordsInBucket = rankedWords.filter((x) => x.rank >= lo && x.rank <= hi).map((x) => x.word);
      const { known, learning, total } = bucketOf(wordsInBucket, srsStore);
      buckets.push({
        label: `${lo}`,
        knownPct: total > 0 ? (known / total) * 100 : 0,
        learningPct: total > 0 ? (learning / total) * 100 : 0,
      });
    }
    return buckets;
  }, [rankedWords, srsStore, rangeStart, rangeEnd]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} fadeColor={colors.background} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Statistics</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
      >
        <View style={[styles.overviewCard, { backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.overviewHeadline}>
            <Text style={[styles.overviewNumber, { color: colors.textPrimary }]}>{overall.known}</Text>
            <Text style={[styles.overviewSuffix, { color: colors.textSecondary }]}>
              {' '}
              / {overall.total} words known
            </Text>
          </View>

          <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
            {overall.total > 0 ? (
              <View style={[styles.barSegment, { width: `${(overall.known / overall.total) * 100}%`, backgroundColor: colors.success }]} />
            ) : null}
            {overall.total > 0 ? (
              <View
                style={[
                  styles.barSegment,
                  { width: `${(overall.learning / overall.total) * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            ) : null}
          </View>

          <View style={styles.legendRow}>
            <LegendItem dotColor={colors.success} label="Known" value={overall.known} colors={colors} />
            <LegendItem dotColor={colors.primary} label="Kind of know" value={overall.learning} colors={colors} />
            <LegendItem
              dotColor={colors.border}
              label="New"
              value={Math.max(0, overall.total - overall.known - overall.learning)}
              colors={colors}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Progress by Range</Text>
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

        <View style={[styles.waveCard, { backgroundColor: colors.surfaceAlt }]}>
          <MasteryWaveChart buckets={waveBuckets} colors={colors} />
        </View>

        {skippedCustomWords > 0 ? (
          <Text style={[styles.footnote, { color: colors.textSecondary }]}>
            {skippedCustomWords} custom word{skippedCustomWords === 1 ? '' : 's'} you added aren't on the 1–6000
            scale, so they're not included in this range view.
          </Text>
        ) : null}

        <Text style={[styles.footnote, { color: colors.textSecondary }]}>
          A word counts as "known" once you've answered it correctly 10 times in a row, or you've marked it "I
          know this" during a quiz. "Kind of know" means you've gotten it right at least once but haven't
          mastered it yet.
        </Text>
      </ScrollView>
    </View>
  );
}

function LegendItem({
  dotColor,
  label,
  value,
  colors,
}: {
  dotColor: string;
  label: string;
  value: number;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: dotColor, borderColor: colors.border }]} />
      <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{label}</Text>
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
  overviewCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  overviewHeadline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  overviewNumber: {
    fontSize: 34,
    fontWeight: '800',
  },
  overviewSuffix: {
    fontSize: 15,
    fontWeight: '600',
  },
  barTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  waveCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
  },
  footnote: {
    fontSize: 12,
    marginTop: 16,
    lineHeight: 17,
  },
});
