import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { withSoftOrangeGlow } from "../../components/SoftOrangeGlowBackdrop";
import ProfileScreen from "../../pages/profile/ProfileScreen";
import SaleDetail from "../../pages/profile/SaleDetail";
import MisExpedienteScreen from "../../pages/profile/MisExpedienteScreen";
import MisExpedienteDocumentoScreen from "../../pages/profile/MisExpedienteDocumentoScreen";
import DriverRoutesHubScreen from "../../pages/profile/DriverRoutesHubScreen";
import type { ProfileStackParamList } from "./ProfileStackParamList";

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const GlowProfile = withSoftOrangeGlow(ProfileScreen);
const GlowSaleDetail = withSoftOrangeGlow(SaleDetail);
const GlowExpediente = withSoftOrangeGlow(MisExpedienteScreen);
const GlowExpedienteDocumento = withSoftOrangeGlow(MisExpedienteDocumentoScreen);
const GlowDriverRoutesHub = withSoftOrangeGlow(DriverRoutesHubScreen);

const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={GlowProfile} />
      <ProfileStack.Screen name="SaleDetail" component={GlowSaleDetail} />
      <ProfileStack.Screen name="MisExpediente" component={GlowExpediente} />
      <ProfileStack.Screen
        name="MisExpedienteDocumento"
        component={GlowExpedienteDocumento}
      />
      <ProfileStack.Screen
        name="DriverRoutesHub"
        component={GlowDriverRoutesHub}
      />
    </ProfileStack.Navigator>
  );
};

export default ProfileNavigator;
