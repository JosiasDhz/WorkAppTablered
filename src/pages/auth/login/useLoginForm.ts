import { useCallback, useMemo, useState } from "react";

export type LoginFormField = "email" | "password";

/** Estado y acciones del formulario (SRP: solo UI de campos). */
export function useLoginForm(initialEmail = "", initialPassword = "") {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const canSubmit = useMemo(
    () => Boolean(email.trim() && password.trim()),
    [email, password],
  );

  return {
    email,
    password,
    setEmail,
    setPassword,
    showPassword,
    toggleShowPassword,
    emailFocused,
    passwordFocused,
    setEmailFocused,
    setPasswordFocused,
    canSubmit,
  };
}
