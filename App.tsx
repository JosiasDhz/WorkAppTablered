import { useEffect, useState } from "react";
import { LogBox, View } from "react-native";
import SplashScreenView from "./src/utils/SplashScreenView";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import store from "./src/redux/store/store";
import AppNavigator from "./src/routes/TabNavigator";
import { installGlobalTapFeedback } from "./src/feedback/installGlobalTapFeedback";
import {
  AppearanceProvider,
  useAppAppearance,
} from "./src/theme/appearance";

LogBox.ignoreAllLogs();
installGlobalTapFeedback();

function AppShell() {
  const [isShowSplash, setIsShowSplash] = useState(true);
  const { colors, scheme } = useAppAppearance();

  useEffect(() => {
    setTimeout(() => {
      setIsShowSplash(false);
    }, 2000);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.layout }}>
      {isShowSplash ? <SplashScreenView /> : <AppNavigator />}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppearanceProvider>
          <AppShell />
        </AppearanceProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
