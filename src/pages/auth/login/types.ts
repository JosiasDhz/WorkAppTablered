import type { Animated } from "react-native";

/** Un segmento de animación de entrada (opacidad + desplazamiento vertical). */
export type LoginRowAnimation = {
  opacity: Animated.Value;
  translateY: Animated.Value;
};

export type MockLoginApiResponse = {
  token: string;
  user: {
    seller: { id: string; name: string };
    avatar: null | Record<string, unknown>;
  };
  accessList: unknown[];
};

export interface LoginSessionDependencies {
  saveInStorage: (key: string, value: string) => Promise<void>;
  getFile: (id: string) => Promise<{ url?: string } | null>;
}
