import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowRight2,
  Moon,
  Mobile,
  Sun1,
} from "iconsax-react-native";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable } from "../../components/SoftPressable";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { SCREEN_GUTTER } from "../../theme/layout";
import {
  useAppAppearance,
  type AppearancePreference,
} from "../../theme/appearance";

const OPTIONS: Array<{
  id: AppearancePreference;
  title: string;
  caption: string;
  Icon: typeof Sun1;
}> = [
  {
    id: "light",
    title: "Claro",
    caption: "Fondos claros y texto oscuro",
    Icon: Sun1,
  },
  {
    id: "dark",
    title: "Oscuro",
    caption: "Fondos oscuros y texto claro",
    Icon: Moon,
  },
  {
    id: "system",
    title: "Sistema",
    caption: "Sigue la configuración del teléfono",
    Icon: Mobile,
  },
];

export default function AparienciaScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();
  const { preference, setPreference, colors, scheme } = useAppAppearance();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        safe: { flex: 1 },
        header: { paddingHorizontal: SCREEN_GUTTER },
        card: {
          marginTop: 8,
          borderRadius: 22,
          backgroundColor: colors.surface,
          overflow: "hidden",
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        rowBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
        },
        copy: { flex: 1, minWidth: 0 },
        title: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.ink,
        },
        caption: {
          marginTop: 2,
          fontSize: 13,
          fontWeight: "500",
          color: colors.mutedInk,
        },
        radio: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        radioOn: {
          borderColor: colors.accent,
        },
        radioDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.accent,
        },
        hint: {
          marginTop: 14,
          marginHorizontal: 4,
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "500",
          color: colors.mutedInk,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <HeaderTitle
          title="Apariencia"
          subtitle="Elige cómo se ve la app"
          tone="light"
          style={styles.header}
          onBack={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        <ScrollView
          onScroll={onAutoTabBarScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_GUTTER,
            paddingTop: 8,
            paddingBottom: Math.max(tabBarHeight, insets.bottom) + 36,
          }}
        >
          <View style={styles.card}>
            {OPTIONS.map((option, index) => {
              const selected = preference === option.id;
              const Icon = option.Icon;
              return (
                <SoftPressable
                  key={option.id}
                  onPress={() => setPreference(option.id)}
                  scaleTo={0.99}
                  accessibilityLabel={option.title}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.row,
                      index < OPTIONS.length - 1 ? styles.rowBorder : null,
                    ]}
                  >
                    <View style={styles.iconWrap}>
                      <Icon size={20} color={colors.accent} variant="Bold" />
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.title}>{option.title}</Text>
                      <Text style={styles.caption}>{option.caption}</Text>
                    </View>
                    <View style={[styles.radio, selected ? styles.radioOn : null]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </View>
                </SoftPressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Ahora mismo estás en modo {scheme === "dark" ? "oscuro" : "claro"}
            {preference === "system" ? " (según el sistema)" : ""}.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
