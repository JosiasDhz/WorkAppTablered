import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Profile } from "iconsax-react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store/store";
import { SOFT } from "../theme/softUi";

export type HeaderAvatarProps = {
  size?: number;
};

export function HeaderAvatar({ size = 40 }: HeaderAvatarProps) {
  const userAvatar = useSelector((state: RootState) => state.auth.userAvatar);
  const [failed, setFailed] = useState(false);
  const uri = userAvatar ? String(userAvatar).trim() : "";
  const showsPhoto = uri.length > 0 && !failed;
  const radius = size / 2;

  return (
    <View
      style={[
        styles.shadow,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <View style={[styles.clip, { borderRadius: radius }]}>
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
            color={SOFT.mutedInk}
            variant="Bold"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: SOFT.field,
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  clip: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SOFT.field,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
