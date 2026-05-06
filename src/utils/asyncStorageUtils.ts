
import AsyncStorage from '@react-native-async-storage/async-storage';

export const retrieveStoredToken = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        console.log('Token recuperado:', token);
        return token;
    } catch (error) {
        console.error('Error al recuperar el token:', error);
        return null;
    }
};
