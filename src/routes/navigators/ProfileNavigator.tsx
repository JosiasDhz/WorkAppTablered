import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../../pages/profile/ProfileScreen';
import SaleDetail from '../../pages/profile/SaleDetail';

const ProfileNavigator = () => {
    const ProfileStack = createNativeStackNavigator();
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="Profile" component={ProfileScreen} />
            <ProfileStack.Screen name="SaleDetail" component={SaleDetail} />
        </ProfileStack.Navigator>
    );
}

export default ProfileNavigator;

