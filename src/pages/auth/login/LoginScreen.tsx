import React, { useMemo } from "react";
import { View, Text, Animated, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { LOGIN_LAYOUT, LOGIN_COPY } from "./constants";
import {
  loginCardShadow,
  cardFooterSolidStyle,
} from "./styles";
import { useReduceMotionPreference } from "./useReduceMotionPreference";
import { useLoginForm } from "./useLoginForm";
import { useLoginAnimations } from "./useLoginAnimations";
import { useLoginAuth } from "./useLoginAuth";
import { LoginHeroBackground } from "./LoginHeroBackground";
import { LoginWelcomeHeader } from "./LoginWelcomeHeader";
import { LoginCredentialFields } from "./LoginCredentialFields";
import { LoginErrorBanner } from "./LoginErrorBanner";
import { LoginBlurPanel } from "./LoginBlurPanel";
import { LoginPrimaryButton } from "./LoginPrimaryButton";

const LOGO_ASSET = require("../../../../assets/table-red-logo.png");

/**
 * Pantalla de login: compone piezas con responsabilidades acotadas.
 * Datos → mockLoginApi + persistLoginSession | UI → componentes | Animación / formulario → hooks.
 */
export default function LoginScreen() {
  const { height } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotionPreference();

  const form = useLoginForm("miguel@tablered.mx", "A1b2c3");
  const { loading, error, submit } = useLoginAuth();
  const {
    titleAnim,
    emailRowAnim,
    passRowAnim,
    btnRowAnim,
    shakeX,
    btnScale,
  } = useLoginAnimations(reduceMotion, error);

  const heroHeight = useMemo(
    () =>
      Math.min(
        height * LOGIN_LAYOUT.heroHeightRatio,
        insets.top + LOGIN_LAYOUT.heroInsetCap,
      ),
    [height, insets.top],
  );

  const onSubmit = () => { 
    void submit(form.email, form.password);
  };

  const submitDisabled = loading || !form.canSubmit;

  return (
    <View className="flex-1 bg-bgGlobal">
      <StatusBar style="light" />
      <LoginHeroBackground height={heroHeight} paddingTop={insets.top} />

      <SafeAreaView className="flex-1 bg-transparent" edges={["bottom"]}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={32}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingTop: LOGIN_LAYOUT.scrollPaddingTop,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              alignSelf: "center",
              marginTop: LOGIN_LAYOUT.cardOffsetDown,
              ...loginCardShadow,
            }}
          >
            <Animated.View
              style={{
                opacity: titleAnim.opacity,
                transform: [{ translateY: titleAnim.translateY }],
                borderRadius: LOGIN_LAYOUT.cardRadius,
                overflow: "hidden",
              }}
            >
              <LoginBlurPanel>
                <LoginWelcomeHeader logoSource={LOGO_ASSET} />
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
                  emailRowAnim={emailRowAnim}
                  passwordRowAnim={passRowAnim}
                />
                <LoginErrorBanner message={error} shakeX={shakeX} />
              </LoginBlurPanel>

              <View style={cardFooterSolidStyle}>
                <LoginPrimaryButton
                  loading={loading}
                  disabled={submitDisabled}
                  onPress={onSubmit}
                  btnScale={btnScale}
                  rowAnim={btnRowAnim}
                />
                <Text
                  className="text-center text-xs mt-6"
                  style={{ color: "rgba(105, 97, 88, 0.65)" }}
                >
                  {LOGIN_COPY.footer}
                </Text>
              </View>
            </Animated.View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}
