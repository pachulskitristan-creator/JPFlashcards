// components/CategoryFilter.tsx
// Horizontal scrollable chip selector, used for both frequency tiers
// and thematic travel categories on the Home screen.

import React from 'react';
import { StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ChipOption {
  key: string;
  label: string;
}

interface CategoryFilterProps {
  options: ChipOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  multiSelect?: boolean;
}

export default function CategoryFilter({
  options,
  selectedKeys,
  onToggle,
  multiSelect = true,
}: CategoryFilterProps) {
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
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
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
    backgroundColor: '#F4F2FF',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#5A4FCF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B85B8',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
