import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QrScreen from '../../pages/qr/QrScreen';


const QRCodeNavigator = () => {
    const QRCodeStack = createNativeStackNavigator();
    return (
        <QRCodeStack.Navigator screenOptions={{ headerShown: false }}>
            <QRCodeStack.Screen name="QRCode" component={QrScreen} />
        </QRCodeStack.Navigator>
    );
}


export default QRCodeNavigator