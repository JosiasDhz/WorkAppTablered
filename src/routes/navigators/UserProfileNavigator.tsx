import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserProfileTabScreen from "../../pages/profile/UserProfileTabScreen";
import MisRegistrosScreen from "../../pages/profile/MisRegistrosScreen";

const Stack = createNativeStackNavigator();

export default function UserProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfileMain" component={UserProfileTabScreen} />
      <Stack.Screen name="MisRegistros" component={MisRegistrosScreen} />
    </Stack.Navigator>
  );
}
