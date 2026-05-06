import React from "react";
import { View, Text } from "react-native";
import {
  ScanBarcode,
  Activity,
  User,
} from "iconsax-react-native";
import {
  TAB_BAR_PRIMARY,
  TAB_BAR_SIDE_ICON,
  TAB_BAR_LAYOUT,
  fabShadow,
} from "./tabBarConstants";

type SideProps = { focused: boolean; label: string };

const sideWrap = {
  alignItems: "center" as const,
  justifyContent: "center" as const,
  paddingHorizontal: TAB_BAR_LAYOUT.sideTapPadding,
  paddingVertical: 4,
  minWidth: 44,
};

const labelStyle = (focused: boolean, forceWhite?: boolean) => ({
  fontSize: 9,
  fontWeight: (focused ? "700" : "500") as "700" | "500",
  marginTop: 1,
  color: forceWhite ? "#FFFFFF" : focused ? TAB_BAR_PRIMARY : TAB_BAR_SIDE_ICON,
});

export function SideUserProfileTab({ focused, label, forceWhite }: SideProps & { forceWhite?: boolean }) {
  return (
    <View style={sideWrap}>
      <User
        size={TAB_BAR_LAYOUT.sideIconSize}
        color={forceWhite ? "#FFFFFF" : focused ? TAB_BAR_PRIMARY : TAB_BAR_SIDE_ICON}
        variant={focused ? "Bold" : "Linear"}
      />
      <Text style={labelStyle(focused, forceWhite)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function SideActivityTab({ focused, label, forceWhite }: SideProps & { forceWhite?: boolean }) {
  return (
    <View style={sideWrap}>
      <Activity
        size={TAB_BAR_LAYOUT.sideIconSize}
        color={forceWhite ? "#FFFFFF" : focused ? TAB_BAR_PRIMARY : TAB_BAR_SIDE_ICON}
        variant={focused ? "Bold" : "Linear"}
      />
      <Text style={labelStyle(focused, forceWhite)} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function TarjetaFab() {
  const d = TAB_BAR_LAYOUT.fabDiameter;
  const r = d / 2;

  return (
    <View
      style={[
        fabShadow,
        {
          width: d,
          height: d,
          borderRadius: r,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: TAB_BAR_PRIMARY,
        },
      ]}
    >
      <ScanBarcode size={40} color="#FFFFFF" variant="Bold" />
    </View>
  );
}
