import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  ScanBarcode,
  Activity,
  User,
} from "iconsax-react-native";
import {
  TAB_BAR_PRIMARY,
  TAB_BAR_LAYOUT,
  fabShadow,
} from "./tabBarConstants";

type SideProps = { focused: boolean; label: string };

const FOCUSED_COLOR = "#FFFFFF";
const UNFOCUSED_COLOR = "rgba(255,255,255,0.45)";

const sideStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },
});

export function SideUserProfileTab({ focused, label }: SideProps) {
  return (
    <View style={sideStyles.wrap}>
      <User
        size={TAB_BAR_LAYOUT.sideIconSize}
        color={focused ? FOCUSED_COLOR : UNFOCUSED_COLOR}
        variant={focused ? "Bold" : "Linear"}
      />
      <Text
        style={[sideStyles.label, { color: focused ? FOCUSED_COLOR : UNFOCUSED_COLOR }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function SideActivityTab({ focused, label }: SideProps) {
  return (
    <View style={sideStyles.wrap}>
      <Activity
        size={TAB_BAR_LAYOUT.sideIconSize}
        color={focused ? FOCUSED_COLOR : UNFOCUSED_COLOR}
        variant={focused ? "Bold" : "Linear"}
      />
      <Text
        style={[sideStyles.label, { color: focused ? FOCUSED_COLOR : UNFOCUSED_COLOR }]}
        numberOfLines={1}
      >
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
