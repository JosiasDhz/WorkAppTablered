import React from "react";
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { createThemedStyles } from "../../../theme/themedStyles";
import {
  LOGIN_COPY,
  LOGO_SIZE,
  getLoginGreeting,
  useLoginColors,
  type LoginColors,
} from "./constants";

type Props = {
  logoSource: ImageSourcePropType;
  greeting?: string;
};

export function LoginWelcomeHeader({ logoSource, greeting }: Props) {
  const styles = useWelcomeStyles();
  const hello = greeting ?? getLoginGreeting();

  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Image
          source={logoSource}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>{LOGIN_COPY.brand}</Text>
          <Text style={styles.brandSub}>{LOGIN_COPY.brandSub}</Text>
        </View>
      </View>
      <Text style={styles.greeting}>{hello}</Text>
      <Text style={styles.subtitle}>{LOGIN_COPY.subtitle}</Text>
    </View>
  );
}

function buildWelcomeStyles(colors: LoginColors) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 28,
    },
    logo: {
      width: LOGO_SIZE.width,
      height: LOGO_SIZE.height,
      borderRadius: 20,
    },
    brandCopy: {
      flex: 1,
      minWidth: 0,
    },
    brand: {
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -0.8,
      color: colors.black,
    },
    brandSub: {
      marginTop: 2,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: colors.orange,
    },
    greeting: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.4,
      color: colors.black,
      lineHeight: 34,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "500",
      color: colors.warmGrey,
    },
  });
}

const useWelcomeStyles = createThemedStyles(useLoginColors, buildWelcomeStyles);
