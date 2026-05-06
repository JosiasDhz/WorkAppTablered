
import * as Location from 'expo-location';

export const fetchLocationAndMunicipio = async (): Promise<{ qrValue: string, municipio: string }> => {
    let qrValue = 'Initial QR Value';
    let municipio = '';

    try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Permission to access location was denied');
            return { qrValue, municipio };
        }

        let location = await Location.getCurrentPositionAsync({});
        const timestamp = new Date().toLocaleTimeString();
        qrValue = `${timestamp}\nLat: ${location.coords.latitude}, Lon: ${location.coords.longitude}`;

        const address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        if (address.length > 0) {
            municipio = address[0].city || address[0].subregion || '';
        } else {
            municipio = 'Municipio Desconocido';
        }
    } catch (error) {
        console.error('Error fetching location:', error);
    }

    return { qrValue, municipio };
};