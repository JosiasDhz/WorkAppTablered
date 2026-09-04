import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Calendar1, CalendarTick, ClipboardTick } from "iconsax-react-native";
import { SoftPressable, SoftReveal } from "../../../components/SoftPressable";
import { useHomeRevealActive } from "../HomeRevealActiveContext";
import { HOME_RADIUS, useHomeColors } from "../homeTheme";

const SHORTCUTS = [
  { label: "Permisos", screen: "MisPermisos", Icon: ClipboardTick },
  { label: "Vacaciones", screen: "MisVacaciones", Icon: CalendarTick },
  { label: "Chequeos", screen: "MisRegistros", Icon: Calendar1 },
] as const;

function openProfileScreen(navigation: any, screen: string) {
  const tabs = navigation.getParent();
  if (tabs) {
    tabs.navigate("UserProfileStack", { screen });
    return;
  }
  navigation.navigate("UserProfileStack", { screen });
}

export function HomeShortcutCards() {
  const navigation = useNavigation<any>();
  const revealActive = useHomeRevealActive();
  const homeColors = useHomeColors();

  return (
    <View style={styles.row}>
      {SHORTCUTS.map(({ label, screen, Icon }, index) => (
        <SoftReveal
          key={label}
          delay={240 + index * 70}
          active={revealActive}
          style={styles.cardReveal}
        >
          <SoftPressable
            onPress={() => openProfileScreen(navigation, screen)}
            scaleTo={0.98}
            style={[styles.card, { backgroundColor: homeColors.surface }]}
            accessibilityLabel={label}
          >
            <View
              style={[
                styles.iconSlot,
                { backgroundColor: homeColors.accentSoft },
              ]}
            >
              <Icon size={20} color={homeColors.accent} variant="Linear" />
            </View>
            <Text style={[styles.label, { color: homeColors.ink }]}>
              {label}
            </Text>
          </SoftPressable>
        </SoftReveal>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  cardReveal: {
    flex: 1,
  },
  card: {
    flex: 1,
    minHeight: 96,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: HOME_RADIUS.section,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSlot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
  },
});
