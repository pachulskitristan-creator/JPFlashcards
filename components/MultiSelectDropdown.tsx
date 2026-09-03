// components/MultiSelectDropdown.tsx
// Looks like Dropdown.tsx from the outside (a pill you tap), but opens
// a sheet of tickboxes (CheckboxList) instead of a single-select list,
// and stays open across multiple taps until the user dismisses it.

import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CheckboxList from './CheckboxList';
import { ThemeColors } from '../theme/theme';
import GlassSurface from './Glass';

interface CheckboxOption {
  key: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectDropdownProps {
  options: CheckboxOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  colors: ThemeColors;
  isDark: boolean;
  placeholder: string;
  sheetTitle: string;
  emptyMessage?: string;
}

export default function MultiSelectDropdown({
  options,
  selectedKeys,
  onToggle,
  colors,
  isDark,
  placeholder,
  sheetTitle,
  emptyMessage,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const summary =
    selectedKeys.length === 0
      ? placeholder
      : selectedKeys.length === options.length && options.length > 0
      ? 'All selected'
      : `${selectedKeys.length} selected`;

  return (
    <>
      <Pressable style={[styles.trigger, { borderColor: colors.border }]} onPress={() => setOpen(true)}>
        <GlassSurface style={StyleSheet.absoluteFill} colors={colors} isDark={isDark} tintColor={colors.card} />
        <Text style={[styles.triggerText, { color: colors.textPrimary }]}>{summary}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <GlassSurface style={StyleSheet.absoluteFill} colors={colors} isDark={isDark} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{sheetTitle}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              <CheckboxList
                options={options}
                selectedKeys={selectedKeys}
                onToggle={onToggle}
                colors={colors}
                emptyMessage={emptyMessage}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,15,25,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  doneText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollArea: {
    marginTop: 4,
  },
});
