import type { Animated } from "react-native";
import type { AttendanceAccessPayload } from "../../../auth/attendanceAccess";

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
  attendanceAccess?: AttendanceAccessPayload;
};

export interface LoginSessionDependencies {
  saveInStorage: (key: string, value: string) => Promise<void>;
  getFile: (id: string) => Promise<{ url?: string } | null>;
}
