import React from "react";
import { View, Text, TextInput, Pressable, Animated } from "react-native";
import { User, Lock, EyeSlash, Eye } from "iconsax-react-native";
import { LOGIN_COLORS, LOGIN_COPY } from "./constants";
import { getCredentialFieldContainerClass } from "./inputFieldStyles";
import type { LoginRowAnimation } from "./types";

type Props = {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  emailFocused: boolean;
  passwordFocused: boolean;
  onEmailFocus: (focused: boolean) => void;
  onPasswordFocus: (focused: boolean) => void;
  emailRowAnim: LoginRowAnimation;
  passwordRowAnim: LoginRowAnimation;
};

/** Campos usuario / contraseña (presentación + callbacks; sin lógica de negocio). */
export function LoginCredentialFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  emailFocused,
  passwordFocused,
  onEmailFocus,
  onPasswordFocus,
  emailRowAnim,
  passwordRowAnim,
}: Props) {
  return (
    <>
      <Text
        className="text-[15px] leading-5 mb-7 mt-4"
        style={{ color: LOGIN_COLORS.warmGrey }}
      >
        {LOGIN_COPY.subtitle}
      </Text>

      <Text
        className="text-xs font-semibold uppercase tracking-wide mb-2"
        style={{ color: LOGIN_COLORS.warmGrey }}
      >
        {LOGIN_COPY.userLabel}
      </Text>
      <Animated.View
        style={{
          opacity: emailRowAnim.opacity,
          transform: [{ translateY: emailRowAnim.translateY }],
        }}
      >
        <View className={getCredentialFieldContainerClass(emailFocused)}>
          <User color={LOGIN_COLORS.warmGrey} variant="Bold" size={22} />
          <TextInput
            value={email}
            onChangeText={onEmailChange}
            className="ml-3 flex-1 text-[16px] text-tableBlack py-0"
            placeholder={LOGIN_COPY.userPlaceholder}
            placeholderTextColor="rgba(105, 97, 88, 0.55)"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onFocus={() => onEmailFocus(true)}
            onBlur={() => onEmailFocus(false)}
          />
        </View>
      </Animated.View>

      <Text
        className="text-xs font-semibold uppercase tracking-wide mb-2 mt-5"
        style={{ color: LOGIN_COLORS.warmGrey }}
      >
        {LOGIN_COPY.passwordLabel}
      </Text>
      <Animated.View
        style={{
          opacity: passwordRowAnim.opacity,
          transform: [{ translateY: passwordRowAnim.translateY }],
        }}
      >
        <View className={getCredentialFieldContainerClass(passwordFocused)}>
          <Lock color={LOGIN_COLORS.warmGrey} variant="Bold" size={22} />
          <TextInput
            value={password}
            className="flex-1 ml-3 text-left text-[16px] text-tableBlack py-0"
            onChangeText={onPasswordChange}
            placeholder={LOGIN_COPY.passwordPlaceholder}
            placeholderTextColor="rgba(105, 97, 88, 0.45)"
            secureTextEntry={!showPassword}
            onFocus={() => onPasswordFocus(true)}
            onBlur={() => onPasswordFocus(false)}
          />
          <Pressable onPress={onTogglePassword} hitSlop={12} className="p-1">
            {showPassword ? (
              <EyeSlash color={LOGIN_COLORS.warmGrey} variant="Bold" size={22} />
            ) : (
              <Eye color={LOGIN_COLORS.warmGrey} variant="Bold" size={22} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}
