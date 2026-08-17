// components/Dropdown.tsx
// A simple single-select dropdown: a pressable "current value" pill
// that opens a modal list. No native picker dependency needed.

import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/theme';

interface DropdownOption {
  key: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  colors: ThemeColors;
}

export default function Dropdown({ options, selectedKey, onSelect, colors }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === selectedKey);

  return (
    <>
      <Pressable
        style={[styles.trigger, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.triggerText, { color: colors.textPrimary }]}>
          {selected?.label ?? 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const active = item.key === selectedKey;
                return (
                  <Pressable
                    style={[styles.row, active && { backgroundColor: colors.card }]}
                    onPress={() => {
                      onSelect(item.key);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.rowText, { color: active ? colors.primary : colors.textPrimary }]}>
                      {item.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    maxHeight: '60%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
