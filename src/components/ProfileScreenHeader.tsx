import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { HeaderTitle } from "./HeaderTitle";

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
  backgroundColor,
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
