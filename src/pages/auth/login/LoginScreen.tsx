import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SoftPressable, SoftReveal } from "../../../components/SoftPressable";
import { SCREEN_GUTTER } from "../../../theme/layout";
import {
  getBiometricKind,
  isBiometricLoginEnabled,
  unlockWithBiometrics,
  type BiometricKind,
} from "../../../services/biometricAuth";
import { restoreStoredSession } from "../../../services/restoreStoredSession";
import {
  LOGIN_COLORS,
  LOGIN_COPY,
  LOGIN_LAYOUT,
  getLoginGreeting,
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
import { useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import type { AppDispatch } from "../../../redux/store/store";

const LOGO_ASSET = require("../../../../assets/table-red-logo.png");

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotionPreference();
  const form = useLoginForm();
  const { loading, error, submit } = useLoginAuth();
  const { shakeX } = useLoginAnimations(reduceMotion, error);
  const [passwordMode, setPasswordMode] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricKind, setBiometricKind] = useState<BiometricKind>("face");
  const [unlocking, setUnlocking] = useState(false);
  const greeting = useMemo(() => getLoginGreeting(), []);

  const refreshBiometricState = useCallback(async () => {
    const enabled = await isBiometricLoginEnabled();
    setBiometricReady(enabled);
    if (!enabled) return;
    const kind = await getBiometricKind();
    setBiometricKind(kind === "none" ? "face" : kind);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshBiometricState();
    }, [refreshBiometricState]),
  );

  useEffect(() => {
    void refreshBiometricState();
  }, [refreshBiometricState]);

  const onSubmit = () => {
    if (!form.canSubmit || loading) return;
    void submit(form.email, form.password);
  };

  const onPrimaryWelcome = () => {
    if (biometricReady) {
      void (async () => {
        setUnlocking(true);
        try {
          const creds = await unlockWithBiometrics();
          if (!creds) return;
          const restored = await restoreStoredSession(dispatch);
          if (restored) return;
          await submit(creds.email, creds.password, {
            skipBiometricPrompt: true,
          });
        } finally {
          setUnlocking(false);
        }
      })();
      return;
    }
    setPasswordMode(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
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
              {passwordMode ? (
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
                  <SoftPressable
                    onPress={() => setPasswordMode(false)}
                    disabled={loading}
                    scaleTo={0.98}
                    style={styles.secondaryWrap}
                    accessibilityLabel={LOGIN_COPY.backWelcome}
                  >
                    <Text style={styles.secondaryLink}>
                      {LOGIN_COPY.backWelcome}
                    </Text>
                  </SoftPressable>
                </View>
              ) : (
                <View style={styles.welcomeActions}>
                  <LoginPrimaryButton
                    loading={loading || unlocking}
                    disabled={loading || unlocking}
                    onPress={onPrimaryWelcome}
                    label={LOGIN_COPY.submit}
                    biometricEnabled={biometricReady}
                    biometricKind={biometricKind}
                  />
                  {biometricReady ? (
                    <SoftPressable
                      onPress={() => setPasswordMode(true)}
                      scaleTo={0.98}
                      style={styles.secondaryWrap}
                      accessibilityLabel={LOGIN_COPY.enterPassword}
                    >
                      <Text style={styles.secondaryLink}>
                        {LOGIN_COPY.enterPassword}
                      </Text>
                    </SoftPressable>
                  ) : null}
                  {error && !passwordMode ? (
                    <LoginErrorBanner message={error} shakeX={shakeX} />
                  ) : null}
                </View>
              )}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LOGIN_COLORS.layout,
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
  welcomeActions: {
    gap: 10,
  },
  formCard: {
    backgroundColor: LOGIN_COLORS.surface,
    borderRadius: LOGIN_LAYOUT.cardRadius,
    padding: 18,
  },
  submitWrap: {
    marginTop: 18,
  },
  secondaryWrap: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  secondaryLink: {
    fontSize: 15,
    fontWeight: "700",
    color: LOGIN_COLORS.orange,
    textAlign: "center",
  },
  quickWrap: {
    marginTop: 28,
  },
  footer: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: LOGIN_COLORS.muted,
  },
});
