import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkerCheckTypeDto } from "../../../services/attendanceService";
import { SOFT } from "../../../theme/softUi";

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
  if (options.length === 0) return null;

  const hasMealOut = options.some((row) => row.code === "COMIDA_SALIDA");
  const label = hasMealOut
    ? "Presiona si es tu fin de comida"
    : "Presiona si es tu inicio de comida";

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
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
                selected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.chipText,
                  selected && styles.chipTextSelected,
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
    color: "#64748B",
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
    borderColor: "rgba(148, 163, 184, 0.45)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: SOFT.accent,
    backgroundColor: "rgba(234, 118, 0, 0.12)",
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  chipTextSelected: {
    color: SOFT.accent,
  },
});
