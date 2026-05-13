import { Linking } from "react-native";

export function buildGoogleMapsDrivingDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

export async function openGoogleMapsDrivingDirections(
  latitude: number,
  longitude: number,
): Promise<void> {
  const url = buildGoogleMapsDrivingDirectionsUrl(latitude, longitude);
  await Linking.openURL(url);
}
