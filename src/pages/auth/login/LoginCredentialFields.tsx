import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Eye, EyeSlash, Lock, User } from "iconsax-react-native";
import { createThemedStyles } from "../../../theme/themedStyles";
import { LOGIN_COPY, useLoginColors, type LoginColors } from "./constants";

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
  onSubmitPassword?: () => void;
  style?: StyleProp<ViewStyle>;
};

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
  onSubmitPassword,
  style,
}: Props) {
  const colors = useLoginColors();
  const styles = useCredentialStyles();

  return (
    <View style={style}>
      <Text style={styles.label}>{LOGIN_COPY.userLabel}</Text>
      <View style={[styles.field, emailFocused && styles.fieldFocused]}>
        <User color={colors.muted} variant="Bold" size={22} />
        <TextInput
          value={email}
          onChangeText={onEmailChange}
          style={styles.input}
          placeholder={LOGIN_COPY.userPlaceholder}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
          returnKeyType="next"
          onFocus={() => onEmailFocus(true)}
          onBlur={() => onEmailFocus(false)}
        />
      </View>

      <Text style={[styles.label, styles.labelSpaced]}>
        {LOGIN_COPY.passwordLabel}
      </Text>
      <View style={[styles.field, passwordFocused && styles.fieldFocused]}>
        <Lock color={colors.muted} variant="Bold" size={22} />
        <TextInput
          value={password}
          onChangeText={onPasswordChange}
          style={styles.input}
          placeholder={LOGIN_COPY.passwordPlaceholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!showPassword}
          returnKeyType="go"
          onSubmitEditing={onSubmitPassword}
          onFocus={() => onPasswordFocus(true)}
          onBlur={() => onPasswordFocus(false)}
        />
        <Pressable onPress={onTogglePassword} hitSlop={12} style={styles.eye}>
          {showPassword ? (
            <EyeSlash color={colors.muted} variant="Bold" size={22} />
          ) : (
            <Eye color={colors.muted} variant="Bold" size={22} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function buildCredentialStyles(colors: LoginColors) {
  return StyleSheet.create({
    label: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: colors.warmGrey,
      marginBottom: 8,
    },
    labelSpaced: {
      marginTop: 18,
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      height: 52,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: colors.field,
      borderWidth: 2,
      borderColor: "transparent",
    },
    fieldFocused: {
      borderColor: "rgba(234, 118, 0, 0.8)",
      backgroundColor: colors.fieldFocus,
    },
    input: {
      marginLeft: 12,
      flex: 1,
      fontSize: 16,
      color: colors.black,
      paddingVertical: 0,
    },
    eye: {
      padding: 4,
    },
  });
}

const useCredentialStyles = createThemedStyles(
  useLoginColors,
  buildCredentialStyles,
);
