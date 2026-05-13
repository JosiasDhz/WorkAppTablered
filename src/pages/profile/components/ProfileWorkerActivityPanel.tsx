import React, { useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { ArrowRight2, Coin } from "iconsax-react-native";
import { profileActividadStyles as styles } from "../profileActividadStyles";

const filters = [
  { key: "all", label: "Todo" },
  { key: "today", label: "Hoy" },
  { key: "week", label: "7 dias" },
] as const;

type Colors = {
  text: string;
  muted: string;
  border: string;
  brandOrange: string;
  success: string;
};

type Nav = { navigate: (name: string, params: Record<string, unknown>) => void };

export type ProfileWorkerActivityPanelProps = {
  colors: Colors;
  navigation: Nav;
};

const activityData = [
  { id: "act-001", folio: "TR-24001", points: 120, sucursal: "Los Rios", date: "Hoy, 10:34 AM" },
  { id: "act-002", folio: "TR-23988", points: 90, sucursal: "5 senores", date: "Ayer, 06:12 PM" },
  { id: "act-003", folio: "TR-23974", points: 150, sucursal: "Madero", date: "Ayer, 01:05 PM" },
  { id: "act-004", folio: "TR-23940", points: 110, sucursal: "Xoxo 1", date: "Lun, 04:48 PM" },
  { id: "act-005", folio: "TR-23912", points: 80, sucursal: "Xoxo 2", date: "Lun, 11:22 AM" },
  { id: "act-006", folio: "TR-23890", points: 140, sucursal: "Etla", date: "Dom, 03:15 PM" },
];

export function ProfileWorkerActivityPanel({
  colors,
  navigation,
}: ProfileWorkerActivityPanelProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "week">("all");

  const filteredActivity = useMemo(() => {
    if (activeFilter === "today") {
      return activityData.filter((x) => x.date.toLowerCase().includes("hoy"));
    }
    if (activeFilter === "week") {
      return activityData.slice(0, 4);
    }
    return activityData;
  }, [activeFilter]);

  return (
    <BlurView
      intensity={Platform.OS === "ios" ? 40 : 55}
      tint="light"
      {...(Platform.OS === "android"
        ? {
            experimentalBlurMethod: "dimezisBlurView" as const,
            blurReductionFactor: 1,
          }
        : {})}
      style={styles.sheet}
    >
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Transacciones</Text>
        <Text style={[styles.sheetCount, { color: colors.muted }]}>
          {filteredActivity.length} registros
        </Text>
      </View>

      <View style={[styles.filterWrap, { borderColor: colors.border }]}>
        {filters.map((item) => {
          const selected = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.9}
              onPress={() => setActiveFilter(item.key)}
              style={[
                styles.filterButton,
                selected ? { backgroundColor: colors.brandOrange } : null,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selected ? "#FFFFFF" : colors.muted },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredActivity.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("SaleDetail", {
              folio: item.folio,
              points: item.points,
              sucursal: item.sucursal,
              date: item.date,
            })
          }
          style={[styles.rowCard, { borderColor: colors.border }]}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: "#FFF1E5" }]}>
              <Coin size={14} color={colors.brandOrange} variant="Bold" />
            </View>
            <View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.sucursal}</Text>
              <Text style={[styles.rowSub, { color: colors.muted }]}>Folio {item.folio}</Text>
            </View>
          </View>

          <View style={styles.rowRight}>
            <Text style={[styles.rowPoints, { color: colors.success }]}>+{item.points}.00</Text>
            <Text style={[styles.rowDate, { color: colors.muted }]}>{item.date}</Text>
          </View>
          <ArrowRight2 size={14} color="#94A3B8" variant="Linear" />
        </TouchableOpacity>
      ))}

      {filteredActivity.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay movimientos</Text>
          <Text style={[styles.emptySub, { color: colors.muted }]}>
            Cambia el filtro para ver actividad.
          </Text>
        </View>
      ) : null}
    </BlurView>
  );
}
