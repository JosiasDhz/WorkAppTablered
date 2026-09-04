import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkerCheckTypeDto } from "../../../services/attendanceService";
import { useAttendanceColors } from "./attendanceTheme";

type Props = {
  options: WorkerCheckTypeDto[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  disabled?: boolean;
};

export function AttendanceCheckTypeSelector({
  options,
  selectedCode,
  onSelect,
  disabled = false,
}: Props) {
  const colors = useAttendanceColors();
  if (options.length === 0) return null;

  const hasMealOut = options.some((row) => row.code === "COMIDA_SALIDA");
  const label = hasMealOut
    ? "Presiona si es tu fin de comida"
    : "Presiona si es tu inicio de comida";

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.code === selectedCode;
          return (
            <Pressable
              key={option.code}
              disabled={disabled}
              onPress={() => onSelect(selected ? null : option.code)}
              style={[
                styles.chip,
                {
                  borderColor: colors.divider,
                  backgroundColor: colors.surface,
                },
                selected && {
                  borderColor: colors.accent,
                  backgroundColor: colors.accentSoft,
                },
                disabled && styles.chipDisabled,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.muted },
                  selected && { color: colors.accent },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {option.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
