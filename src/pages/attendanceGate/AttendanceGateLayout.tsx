import React, { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { HeaderTitle } from "../../components/HeaderTitle";
import { SoftPressable } from "../../components/SoftPressable";
import { SCREEN_GUTTER } from "../../theme/layout";
import type { AppDispatch } from "../../redux/store/store";
import { logout } from "../../redux/slices/authSlice";
import { clearStorage } from "../../utils";
import { useAttendanceColors } from "../qr/attendance/attendanceTheme";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AttendanceGateLayout({ title, subtitle, children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const colors = useAttendanceColors();

  const handleLogout = async () => {
    await clearStorage();
    dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <HeaderTitle
        title={title}
        subtitle={subtitle}
        tone="light"
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {children}

        <SoftPressable
          onPress={() => {
            void handleLogout();
          }}
          style={styles.secondaryButton}
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>
            Cerrar sesión
          </Text>
        </SoftPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SCREEN_GUTTER,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 4,
  },
  secondaryButton: {
    marginTop: 20,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
