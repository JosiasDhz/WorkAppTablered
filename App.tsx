import { useEffect, useState } from 'react';
import { LogBox, Text, View } from 'react-native';
import SplashScreenView from './src/utils/SplashScreenView';
import TabNavigator from './src/routes/TabNavigator';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/redux/store/store';
import { RootState } from './src/redux/store/store';
import AppNavigator from './src/routes/TabNavigator';


LogBox.ignoreAllLogs();


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
        <View className="flex-1 bg-white">
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
