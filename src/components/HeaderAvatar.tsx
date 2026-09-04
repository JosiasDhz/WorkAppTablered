import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Profile } from "iconsax-react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store/store";
import { useAppAppearance } from "../theme/appearance";

export type HeaderAvatarProps = {
  size?: number;
};

export function HeaderAvatar({ size = 40 }: HeaderAvatarProps) {
  const userAvatar = useSelector((state: RootState) => state.auth.userAvatar);
  const { colors, scheme } = useAppAppearance();
  const [failed, setFailed] = useState(false);
  const uri = userAvatar ? String(userAvatar).trim() : "";
  const showsPhoto = uri.length > 0 && !failed;
  const radius = size / 2;

  return (
    <View
      style={[
        styles.shadow,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.field,
          shadowColor: scheme === "dark" ? "#000000" : "#1C1917",
          shadowOpacity: scheme === "dark" ? 0.35 : 0.07,
        },
      ]}
    >
      <View
        style={[
          styles.clip,
          { borderRadius: radius, backgroundColor: colors.field },
        ]}
      >
        {showsPhoto ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Profile
            size={Math.round(size * 0.52)}
            color={colors.mutedInk}
            variant="Bold"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  clip: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
