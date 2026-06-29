import React, { useEffect, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { pad } from '../utils/time';
import { theme } from '../theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_PADDING = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT;

export interface WheelItem {
  label: string;
  value: number;
}

interface WheelColumnProps {
  items: WheelItem[];
  value: number;
  onChange: (value: number) => void;
  width?: number;
  style?: ViewStyle;
}

function snapIndex(offsetY: number, maxIndex: number): number {
  return Math.max(0, Math.min(maxIndex, Math.round(offsetY / ITEM_HEIGHT)));
}

export function WheelColumn({ items, value, onChange, width = 64, style }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));

  useEffect(() => {
    if (selectedIndex < 0) return;
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
  }, [selectedIndex, items]);

  const commitScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = snapIndex(event.nativeEvent.contentOffset.y, items.length - 1);
    const next = items[index]?.value;
    if (next == null) return;
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    if (next !== value) onChange(next);
  };

  return (
    <View style={[styles.columnWrap, { width, height: ITEM_HEIGHT * VISIBLE_ROWS }, style]}>
      <View style={styles.selectionBand} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={commitScroll}
        onScrollEndDrag={commitScroll}
        contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <View key={`${item.value}-${item.label}`} style={styles.itemRow}>
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface TimeWheelPickerProps {
  minutes: number;
  onChange: (minutes: number) => void;
  label?: string;
}

export function TimeWheelPicker({ minutes, onChange, label }: TimeWheelPickerProps) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;

  const hourItems = useMemo(
    () => Array.from({ length: 24 }, (_, h) => ({ label: pad(h), value: h })),
    []
  );
  const minuteItems = useMemo(
    () => Array.from({ length: 60 }, (_, m) => ({ label: pad(m), value: m })),
    []
  );

  const setHour = (h: number) => onChange(Math.min(1439, h * 60 + minute));
  const setMinute = (m: number) => onChange(Math.min(1439, hour * 60 + m));

  return (
    <View style={styles.block}>
      {label ? <Text style={styles.blockLabel}>{label}</Text> : null}
      <View style={styles.timeRow}>
        <WheelColumn items={hourItems} value={hour} onChange={setHour} width={72} />
        <Text style={styles.separator}>:</Text>
        <WheelColumn items={minuteItems} value={minute} onChange={setMinute} width={72} />
      </View>
    </View>
  );
}

interface DurationWheelPickerProps {
  durationMinutes: number;
  onChange: (minutes: number) => void;
  maxMinutes?: number;
  label?: string;
}

export function DurationWheelPicker({
  durationMinutes,
  onChange,
  maxMinutes = 12 * 60,
  label,
}: DurationWheelPickerProps) {
  const safe = Math.max(1, Math.min(maxMinutes, durationMinutes));
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;

  const hourItems = useMemo(() => {
    const maxHour = Math.floor(maxMinutes / 60);
    return Array.from({ length: maxHour + 1 }, (_, h) => ({
      label: `${h}`,
      value: h,
    }));
  }, [maxMinutes]);

  const minuteItems = useMemo(
    () => Array.from({ length: 60 }, (_, m) => ({ label: pad(m), value: m })),
    []
  );

  const apply = (h: number, m: number) => {
    const total = Math.max(1, Math.min(maxMinutes, h * 60 + m));
    onChange(total);
  };

  return (
    <View style={styles.block}>
      {label ? <Text style={styles.blockLabel}>{label}</Text> : null}
      <View style={styles.durationRow}>
        <View style={styles.durationCol}>
          <WheelColumn
            items={hourItems}
            value={hour}
            onChange={(h) => apply(h, minute)}
            width={72}
          />
          <Text style={styles.unitLabel}>時間</Text>
        </View>
        <View style={styles.durationCol}>
          <WheelColumn
            items={minuteItems}
            value={minute}
            onChange={(m) => apply(hour, m)}
            width={72}
          />
          <Text style={styles.unitLabel}>分</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columnWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_PADDING,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    backgroundColor: theme.accentSoft,
    zIndex: 1,
  },
  itemRow: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  itemTextActive: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
  },
  block: {
    marginBottom: 8,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    borderRadius: theme.radius.sm,
    paddingVertical: 4,
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textSecondary,
    marginHorizontal: 4,
    marginBottom: 2,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: theme.bg,
    borderRadius: theme.radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  durationCol: {
    alignItems: 'center',
  },
  unitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 2,
  },
});
