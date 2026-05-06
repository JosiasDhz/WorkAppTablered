import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { HeaderTitle } from "./HeaderTitle";

const COLORS = {
  bg: "#F7F7F6",
};

export type ProfileScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function ProfileScreenHeader({
  title,
  subtitle,
  onBack,
  backgroundColor = COLORS.bg,
  style,
}: ProfileScreenHeaderProps) {
  return (
    <HeaderTitle
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      tone="light"
      backgroundColor={backgroundColor}
      style={[{ paddingTop: 18 }, style]}
    />
  );
}
