// components/MasteryWaveChart.tsx
// Two overlapping smooth area curves — % known and % "kind of know" —
// across buckets of the selected rank range. Not stacked: the two
// series are independent and allowed to overlap, so where both are
// high you see the fills blend, same idea as an income/outgo wave
// chart. Per the dataviz skill: >=2 series always gets a legend and
// direct value labels, never color-alone identity.

import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { ThemeColors } from '../theme/theme';

export interface WaveBucket {
  label: string;
  knownPct: number; // 0-100
  learningPct: number; // 0-100
}

interface MasteryWaveChartProps {
  buckets: WaveBucket[];
  colors: ThemeColors;
  height?: number;
}

const H_PADDING = 4;
const TOP_PADDING = 34;
const BOTTOM_PADDING = 22;

function smoothAreaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${baselineY} L ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  d += ` L ${points[points.length - 1].x} ${baselineY} Z`;
  return d;
}

export default function MasteryWaveChart({ buckets, colors, height = 190 }: MasteryWaveChartProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const plotHeight = height - TOP_PADDING - BOTTOM_PADDING;
  const baselineY = TOP_PADDING + plotHeight;
  const n = buckets.length;
  const step = n > 1 ? (width - H_PADDING * 2) / (n - 1) : 0;

  const knownPoints = buckets.map((b, i) => ({
    x: H_PADDING + i * step,
    y: baselineY - (b.knownPct / 100) * plotHeight,
  }));
  const learningPoints = buckets.map((b, i) => ({
    x: H_PADDING + i * step,
    y: baselineY - (b.learningPct / 100) * plotHeight,
  }));

  const maxKnownIdx = buckets.reduce((best, b, i) => (b.knownPct > buckets[best].knownPct ? i : best), 0);
  const maxLearningIdx = buckets.reduce(
    (best, b, i) => (b.learningPct > buckets[best].learningPct ? i : best),
    0
  );

  return (
    <View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Known</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Kind of know</Text>
        </View>
      </View>

      <View style={{ height }} onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Line
              x1={0}
              y1={baselineY}
              x2={width}
              y2={baselineY}
              stroke={colors.border}
              strokeWidth={1}
            />

            <Path d={smoothAreaPath(learningPoints, baselineY)} fill={colors.primary} fillOpacity={0.28} />
            <Path
              d={learningPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              stroke={colors.primary}
              strokeWidth={2}
              fill="none"
            />

            <Path d={smoothAreaPath(knownPoints, baselineY)} fill={colors.success} fillOpacity={0.3} />
            <Path
              d={knownPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              stroke={colors.success}
              strokeWidth={2}
              fill="none"
            />
          </Svg>
        ) : null}

        {width > 0 ? (
          <>
            <Text
              style={[
                styles.peakLabel,
                { color: colors.success, left: knownPoints[maxKnownIdx].x - 20, top: knownPoints[maxKnownIdx].y - 22 },
              ]}
            >
              {Math.round(buckets[maxKnownIdx].knownPct)}%
            </Text>
            <Text
              style={[
                styles.peakLabel,
                {
                  color: colors.primary,
                  left: learningPoints[maxLearningIdx].x - 20,
                  top: learningPoints[maxLearningIdx].y - 22,
                },
              ]}
            >
              {Math.round(buckets[maxLearningIdx].learningPct)}%
            </Text>
          </>
        ) : null}

        <View style={styles.xLabelsRow}>
          {buckets.map((b, i) =>
            i === 0 || i === buckets.length - 1 || i === Math.floor(buckets.length / 2) ? (
              <Text key={b.label} style={[styles.xLabel, { color: colors.textSecondary }]}>
                {b.label}
              </Text>
            ) : (
              <Text key={b.label} style={styles.xLabel} />
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  peakLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '800',
    width: 40,
    textAlign: 'center',
  },
  xLabelsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabel: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
