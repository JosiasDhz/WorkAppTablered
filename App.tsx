import { useEffect, useState } from 'react';
import { LogBox, View } from 'react-native';
import SplashScreenView from './src/utils/SplashScreenView';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/redux/store/store';
import AppNavigator from './src/routes/TabNavigator';
import { installGlobalTapFeedback } from './src/feedback/installGlobalTapFeedback';
import { SOFT } from './src/theme/softUi';


LogBox.ignoreAllLogs();
installGlobalTapFeedback();


export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsShowSplash(false);
    }, 2000);
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: SOFT.layout }}>
          {isShowSplash ? (
            <SplashScreenView />
          ) : (
            <AppNavigator />
          )}
          <StatusBar style="dark" />
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}
