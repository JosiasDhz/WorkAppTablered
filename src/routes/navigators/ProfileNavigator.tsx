import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../../pages/profile/ProfileScreen";
import SaleDetail from "../../pages/profile/SaleDetail";
import type { ProfileStackParamList } from "./ProfileStackParamList";

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="SaleDetail" component={SaleDetail} />
    </ProfileStack.Navigator>
  );
};

export default ProfileNavigator;
