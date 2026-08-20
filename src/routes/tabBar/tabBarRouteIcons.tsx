import React, { type ComponentType } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  ScanBarcode,
  Home2,
  User,
  Notification,
} from "iconsax-react-native";
import {
  TAB_BAR_FOCUSED,
  TAB_BAR_LAYOUT,
  TAB_BAR_SURFACE,
  TAB_BAR_UNFOCUSED,
  tabBarShadow,
} from "./tabBarConstants";

type IconProps = {
  size?: number;
  color?: string;
  variant?: "Linear" | "Outline" | "Bold" | "Bulk" | "Broken" | "TwoTone";
};

type PillProps = {
  focused: boolean;
  label: string;
  Icon: ComponentType<IconProps>;
  badge?: string | number;
};

const pillStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  iconSlot: {
    width: 32,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    includeFontPadding: false,
  },
  label: {
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 13,
    includeFontPadding: false,
  },
  labelOn: {
    fontWeight: "700",
  },
});

export function CafePillTab({ focused, label, Icon, badge }: PillProps) {
  const color = focused ? TAB_BAR_FOCUSED : TAB_BAR_UNFOCUSED;
  return (
    <View style={pillStyles.wrap}>
      <View style={pillStyles.iconSlot}>
        <Icon
          size={TAB_BAR_LAYOUT.sideIconSize}
          color={color}
          variant={focused ? "Bold" : "Linear"}
        />
        {badge != null && String(badge) !== "" ? (
          <View style={pillStyles.badge}>
            <Text style={pillStyles.badgeTxt}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[
          pillStyles.label,
          focused ? pillStyles.labelOn : null,
          { color },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function CafeProfileOrb({ focused }: { focused: boolean }) {
  const d = TAB_BAR_LAYOUT.profileCircle;
  const color = focused ? TAB_BAR_FOCUSED : TAB_BAR_UNFOCUSED;

  return (
    <View
      style={[
        tabBarShadow,
        orbStyles.circle,
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: TAB_BAR_SURFACE,
        },
      ]}
    >
      <User size={24} color={color} variant={focused ? "Bold" : "Linear"} />
    </View>
  );
}

const orbStyles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export const CafeTabIcons = {
  Home: Home2,
  QR: ScanBarcode,
  Avisos: Notification,
} as const;
