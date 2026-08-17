// components/CheckboxList.tsx
// Vertical tickbox list, used for both Vocabulary Range and Travel
// Topics selection now (replacing the horizontal chip scroller).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/theme';

interface CheckboxOption {
  key: string;
  label: string;
  sublabel?: string;
}

interface CheckboxListProps {
  options: CheckboxOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  colors: ThemeColors;
  emptyMessage?: string;
}

export default function CheckboxList({
  options,
  selectedKeys,
  onToggle,
  colors,
  emptyMessage,
}: CheckboxListProps) {
  if (options.length === 0) {
    return emptyMessage ? (
      <Text style={[styles.empty, { color: colors.textSecondary }]}>{emptyMessage}</Text>
    ) : null;
  }

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const checked = selectedKeys.includes(opt.key);
        return (
          <Pressable
            key={opt.key}
            style={styles.row}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onToggle(opt.key);
            }}
          >
            <View
              style={[
                styles.box,
                {
                  borderColor: checked ? colors.primary : colors.border,
                  backgroundColor: checked ? colors.primary : 'transparent',
                },
              ]}
            >
              {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
            </View>
            <View style={styles.labelWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{opt.label}</Text>
              {opt.sublabel ? (
                <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{opt.sublabel}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 12,
    marginTop: 1,
  },
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
