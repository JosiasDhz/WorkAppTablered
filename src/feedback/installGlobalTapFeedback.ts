import { playTapFeedback } from "./tapFeedback";

type PressabilityConfig = {
  onPress?: (event: unknown) => unknown;
  disabled?: boolean;
};

type ConfiguredPressabilityConfig = PressabilityConfig & {
  tapFeedbackWrapped?: boolean;
};

let installed = false;

export function installGlobalTapFeedback(): void {
  if (installed) return;
  installed = true;

  try {
    const Pressability =
      require("react-native/Libraries/Pressability/Pressability").default;
    const configure = Pressability.prototype.configure;

    Pressability.prototype.configure = function patchedConfigure(
      config: ConfiguredPressabilityConfig,
    ) {
      const onPress = config?.onPress;
      if (typeof onPress !== "function" || config.tapFeedbackWrapped) {
        return configure.call(this, config);
      }

      return configure.call(this, {
        ...config,
        tapFeedbackWrapped: true,
        onPress: (event: unknown) => {
          playTapFeedback();
          return onPress(event);
        },
      });
    };
  } catch {
    installed = false;
  }
}
