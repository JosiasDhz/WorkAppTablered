import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoginCurve } from "iconsax-react-native";
import { SoftPressable } from "../../../components/SoftPressable";
import { TAB_BAR_CAFE_ANDROID } from "../../../routes/tabBar/tabBarConstants";
import type { BiometricKind } from "../../../services/biometricAuth";
import { LOGIN_COPY } from "./constants";

type Props = {
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  label?: string;
  biometricEnabled?: boolean;
  biometricKind?: BiometricKind | null;
};

function BiometricIcon({ kind }: { kind: BiometricKind | null | undefined }) {
  if (kind === "fingerprint") {
    return (
      <MaterialCommunityIcons name="fingerprint" size={22} color="#FFFFFF" />
    );
  }
  return (
    <MaterialCommunityIcons
      name="face-recognition"
      size={22}
      color="#FFFFFF"
    />
  );
}

export function LoginPrimaryButton({
  loading,
  disabled,
  onPress,
  label = LOGIN_COPY.submit,
  biometricEnabled = false,
  biometricKind = null,
}: Props) {
  return (
    <SoftPressable
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.98}
      accessibilityLabel={label}
      style={styles.wrap}
    >
      <View style={[styles.btn, (disabled || loading) && styles.btnDisabled]}>
        <Text style={styles.label}>
          {loading ? LOGIN_COPY.submitting : label}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.iconWell}>
            {biometricEnabled ? (
              <BiometricIcon kind={biometricKind} />
            ) : (
              <LoginCurve size={18} color="#FFFFFF" variant="Bold" />
            )}
          </View>
        )}
      </View>
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  btn: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: TAB_BAR_CAFE_ANDROID,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
});
