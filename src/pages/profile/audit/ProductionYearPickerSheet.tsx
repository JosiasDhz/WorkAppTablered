import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createThemedStyles } from "../../../theme/themedStyles";
import { useAuditUi, type AuditUi } from "./auditUi";

const MIN_PRODUCTION_YEAR = 1950;
const ITEM_HEIGHT = 34;
const VISIBLE_ROWS = 5;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

function buildYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let year = current; year >= MIN_PRODUCTION_YEAR; year -= 1) years.push(year);
  return years;
}

export function ProductionYearPickerSheet({
  visible,
  productName,
  value,
  onSelect,
  onClear,
  onClose,
}: {
  visible: boolean;
  productName?: string;
  value: number | null;
  onSelect: (year: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const styles = useYearPickerStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Año de producción</Text>
          {productName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {productName}
            </Text>
          ) : null}
          <YearPickerBody value={value} onSelect={onSelect} onClear={onClear} />
        </View>
      </View>
    </Modal>
  );
}

function YearPickerBody({
  value,
  onSelect,
  onClear,
}: {
  value: number | null;
  onSelect: (year: number) => void;
  onClear: () => void;
}) {
  const styles = useYearPickerStyles();
  const years = useMemo(buildYearOptions, []);
  const [draft, setDraft] = useState(value ?? years[0]);

  return (
    <>
      <YearWheel years={years} initialYear={draft} onChange={setDraft} />
      <Pressable style={styles.confirm} onPress={() => onSelect(draft)}>
        <Text style={styles.confirmText}>Listo</Text>
      </Pressable>
      {value !== null ? (
        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearText}>Quitar año</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function YearWheel({
  years,
  initialYear,
  onChange,
}: {
  years: number[];
  initialYear: number;
  onChange: (year: number) => void;
}) {
  const styles = useYearPickerStyles();
  const listRef = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const initialIndex = Math.max(0, years.indexOf(initialYear));
  const lastIndex = useRef(initialIndex);
  const positioned = useRef(false);

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const raw = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const index = Math.min(years.length - 1, Math.max(0, raw));
          if (index === lastIndex.current) return;
          lastIndex.current = index;
          void Haptics.selectionAsync();
          onChange(years[index]);
        },
      }),
    [onChange, scrollY, years],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<number>) => {
      const inputRange = [-2, -1, 0, 1, 2].map((step) => (index + step) * ITEM_HEIGHT);
      const opacity = scrollY.interpolate({
        inputRange,
        outputRange: [0.3, 0.6, 1, 0.6, 0.3],
        extrapolate: "clamp",
      });
      const rotateX = scrollY.interpolate({
        inputRange,
        outputRange: ["-30deg", "-15deg", "0deg", "15deg", "30deg"],
        extrapolate: "clamp",
      });
      const scale = scrollY.interpolate({
        inputRange,
        outputRange: [0.92, 0.97, 1, 0.97, 0.92],
        extrapolate: "clamp",
      });
      return (
        <Pressable
          onPress={() => listRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true })}
          accessibilityRole="button"
          accessibilityLabel={`Año ${item}`}
        >
          <Animated.View
            style={[
              styles.wheelItem,
              { opacity, transform: [{ perspective: 600 }, { rotateX }, { scale }] },
            ]}
          >
            <Text style={styles.wheelText}>{item}</Text>
          </Animated.View>
        </Pressable>
      );
    },
    [scrollY, styles],
  );

  return (
    <View style={styles.wheel}>
      <View style={styles.wheelBand} pointerEvents="none" />
      <Animated.FlatList
        ref={listRef}
        data={years}
        keyExtractor={(year) => String(year)}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: WHEEL_PADDING + ITEM_HEIGHT * index,
          index,
        })}
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
        onLayout={() => {
          if (positioned.current) return;
          positioned.current = true;
          listRef.current?.scrollToOffset({ offset: initialIndex * ITEM_HEIGHT, animated: false });
        }}
        contentContainerStyle={styles.wheelContent}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={years.length}
      />
    </View>
  );
}

function buildYearPickerStyles(ui: AuditUi) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(28, 25, 23, 0.4)",
    },
    card: {
      backgroundColor: ui.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      paddingHorizontal: 16,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: ui.field,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: ui.ink,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 12,
      fontWeight: "600",
      color: ui.muted,
      textAlign: "center",
      marginTop: 4,
      paddingHorizontal: 12,
    },
    wheel: {
      height: ITEM_HEIGHT * VISIBLE_ROWS,
      marginTop: 10,
      marginBottom: 6,
      justifyContent: "center",
    },
    wheelBand: {
      position: "absolute",
      left: 0,
      right: 0,
      top: WHEEL_PADDING,
      height: ITEM_HEIGHT,
      borderRadius: 10,
      backgroundColor: ui.field,
    },
    wheelContent: { paddingVertical: WHEEL_PADDING },
    wheelItem: {
      height: ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    wheelText: {
      fontSize: 20,
      fontWeight: "600",
      color: ui.ink,
      fontVariant: ["tabular-nums"],
    },
    confirm: {
      marginTop: 8,
      backgroundColor: ui.accent,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    confirmText: { color: ui.onTone, fontSize: 15, fontWeight: "700" },
    clearBtn: {
      marginTop: 8,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: "center",
      backgroundColor: ui.roseSoft,
    },
    clearText: { fontSize: 14, fontWeight: "700", color: ui.rose },
  });
}

const useYearPickerStyles = createThemedStyles(useAuditUi, buildYearPickerStyles);
