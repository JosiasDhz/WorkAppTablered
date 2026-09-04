import React, { type ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Headphone,
  Personalcard,
  Profile2User,
  ShieldTick,
} from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { createThemedStyles } from "../../../theme/themedStyles";
import { LOGIN_COPY, useLoginColors, type LoginColors } from "./constants";

type IconProps = {
  size?: number;
  color?: string;
  variant?: "Linear" | "Outline" | "Bold" | "Bulk" | "Broken" | "TwoTone";
};

type QuickItem = {
  id: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

const ITEMS: QuickItem[] = [
  { id: "help", label: LOGIN_COPY.quickHelp, Icon: Headphone },
  { id: "secure", label: LOGIN_COPY.quickSecure, Icon: ShieldTick },
  { id: "worker", label: LOGIN_COPY.quickWorker, Icon: Profile2User },
  { id: "identity", label: LOGIN_COPY.quickIdentity, Icon: Personalcard },
];

type Props = {
  onPressItem?: (id: string) => void;
};

export function LoginQuickActions({ onPressItem }: Props) {
  const colors = useLoginColors();
  const styles = useQuickActionStyles();
  return (
    <View style={styles.row}>
      {ITEMS.map((item) => {
        const Icon = item.Icon;
        return (
          <SoftPressable
            key={item.id}
            onPress={() => onPressItem?.(item.id)}
            scaleTo={0.94}
            style={styles.item}
            accessibilityLabel={item.label}
          >
            <View style={styles.orb}>
              <Icon size={20} color={colors.orange} variant="Bold" />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </SoftPressable>
        );
      })}
    </View>
  );
}

function buildQuickActionStyles(colors: LoginColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    item: {
      flex: 1,
      alignItems: "center",
      width: "auto",
    },
    orb: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    label: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "600",
      color: colors.warmGrey,
      textAlign: "center",
    },
  });
}

const useQuickActionStyles = createThemedStyles(
  useLoginColors,
  buildQuickActionStyles,
);
