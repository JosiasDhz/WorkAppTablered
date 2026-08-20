import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { withSoftOrangeGlow } from "../../components/SoftOrangeGlowBackdrop";
import NotificationsScreen from "../../pages/notifications/NotificationsScreen";
import NotificationDetailScreen from "../../pages/notifications/NotificationDetailScreen";
import type { NotificationsStackParamList } from "./NotificationsStackParamList";

const Stack = createNativeStackNavigator<NotificationsStackParamList>();
const GlowList = withSoftOrangeGlow(NotificationsScreen);
const GlowDetail = withSoftOrangeGlow(NotificationDetailScreen);

export default function NotificationsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsList" component={GlowList} />
      <Stack.Screen name="NotificationDetail" component={GlowDetail} />
    </Stack.Navigator>
  );
}
