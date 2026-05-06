import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from "../../pages/auth/Login";

const AuthNavigator = () => {
    const AuthNavigator = createNativeStackNavigator();
    return (
        <AuthNavigator.Navigator screenOptions={{ headerShown: false }}>
            <AuthNavigator.Screen name="History" component={Login} />
        </AuthNavigator.Navigator>
    );
}

export default AuthNavigator;   