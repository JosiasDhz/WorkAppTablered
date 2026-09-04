import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SoftReveal } from "../../../components/SoftPressable";
import { SCREEN_GUTTER } from "../../../theme/layout";
import { useAppAppearance } from "../../../theme/appearance";
import { createThemedStyles } from "../../../theme/themedStyles";
import {
  LOGIN_COPY,
  LOGIN_LAYOUT,
  getLoginGreeting,
  useLoginColors,
  type LoginColors,
} from "./constants";
import { useLoginForm } from "./useLoginForm";
import { useLoginAnimations } from "./useLoginAnimations";
import { useLoginAuth } from "./useLoginAuth";
import { useReduceMotionPreference } from "./useReduceMotionPreference";
import { LoginWelcomeHeader } from "./LoginWelcomeHeader";
import { LoginCredentialFields } from "./LoginCredentialFields";
import { LoginErrorBanner } from "./LoginErrorBanner";
import { LoginPrimaryButton } from "./LoginPrimaryButton";
import { LoginQuickActions } from "./LoginQuickActions";

const LOGO_ASSET = require("../../../../assets/table-red-logo.png");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { scheme } = useAppAppearance();
  const styles = useLoginScreenStyles();
  const reduceMotion = useReduceMotionPreference();
  const form = useLoginForm();
  const { loading, error, submit } = useLoginAuth();
  const { shakeX } = useLoginAnimations(reduceMotion, error);
  const greeting = useMemo(() => getLoginGreeting(), []);

  const onSubmit = () => {
    if (!form.canSubmit || loading) return;
    void submit(form.email, form.password);
  };

  return (
    <View style={styles.root}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={36}
          enableResetScrollToCoords={false}
          keyboardOpeningTime={0}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top * 0.15, 12),
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            <SoftReveal delay={0}>
              <LoginWelcomeHeader
                logoSource={LOGO_ASSET}
                greeting={greeting}
              />
            </SoftReveal>

            <SoftReveal delay={80} style={styles.mainBlock}>
              <View style={styles.formCard}>
                <LoginCredentialFields
                  email={form.email}
                  password={form.password}
                  onEmailChange={form.setEmail}
                  onPasswordChange={form.setPassword}
                  showPassword={form.showPassword}
                  onTogglePassword={form.toggleShowPassword}
                  emailFocused={form.emailFocused}
                  passwordFocused={form.passwordFocused}
                  onEmailFocus={form.setEmailFocused}
                  onPasswordFocus={form.setPasswordFocused}
                  onSubmitPassword={onSubmit}
                />
                <LoginErrorBanner message={error} shakeX={shakeX} />
                <View style={styles.submitWrap}>
                  <LoginPrimaryButton
                    loading={loading}
                    disabled={!form.canSubmit || loading}
                    onPress={onSubmit}
                    label={LOGIN_COPY.submit}
                  />
                </View>
              </View>
            </SoftReveal>

            <SoftReveal delay={160} style={styles.quickWrap}>
              <LoginQuickActions />
            </SoftReveal>

            <Text style={styles.footer}>{LOGIN_COPY.footer}</Text>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

function buildLoginScreenStyles(colors: LoginColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.layout,
    },
    safe: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SCREEN_GUTTER,
      justifyContent: "center",
    },
    column: {
      width: "100%",
      maxWidth: LOGIN_LAYOUT.maxWidth,
      alignSelf: "center",
    },
    mainBlock: {
      marginTop: 28,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: LOGIN_LAYOUT.cardRadius,
      padding: 18,
    },
    submitWrap: {
      marginTop: 18,
    },
    quickWrap: {
      marginTop: 28,
    },
    footer: {
      marginTop: 28,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "500",
      color: colors.muted,
    },
  });
}

const useLoginScreenStyles = createThemedStyles(
  useLoginColors,
  buildLoginScreenStyles,
);
