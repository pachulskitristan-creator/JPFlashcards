// components/CategoryFilter.tsx

import React from 'react';
import { StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';

interface ChipOption {
  key: string;
  label: string;
}

interface CategoryFilterProps {
  options: ChipOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  colors: ThemeColors;
}

export default function CategoryFilter({ options, selectedKeys, onToggle, colors }: CategoryFilterProps) {
  const handlePress = (key: string) => {
    Haptics.selectionAsync().catch(() => {});
    onToggle(key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = selectedKeys.includes(opt.key);
        return (
          <Pressable
            key={opt.key}
            onPress={() => handlePress(opt.key)}
            style={[
              styles.chip,
              { backgroundColor: active ? colors.primary : colors.card },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? colors.textOnPrimary : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
