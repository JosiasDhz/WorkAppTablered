import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { withSoftOrangeGlow } from "../../components/SoftOrangeGlowBackdrop";
import QrScreen from "../../pages/qr/QrScreen";

const QRCodeStack = createNativeStackNavigator();
const GlowQr = withSoftOrangeGlow(QrScreen);

const QRCodeNavigator = () => {
  return (
    <QRCodeStack.Navigator screenOptions={{ headerShown: false }}>
      <QRCodeStack.Screen name="QRCode" component={GlowQr} />
    </QRCodeStack.Navigator>
  );
};

export default QRCodeNavigator;
