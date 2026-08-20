import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateInfo } from "../interfaces/DateInfo";
import moment from "moment";

export const saveInStorage = async (key: string, value: string) => {
  try {
    const response = await AsyncStorage.setItem(key, value);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getFromStorage = async (key: string) => {
  try {
    const response = await AsyncStorage.getItem(key);
    return response;
  } catch (error) {
    throw error;
  }
};

export const removeFromStorage = async (key: string) => {
  try {
    const response = await AsyncStorage.removeItem(key);
    return response;
  } catch (error) {
    throw error;
  }
};

export const clearStorage = async () => {
  try {
    const biometricFlag = await AsyncStorage.getItem(
      "tablered-biometric-enabled",
    );
    const response = await AsyncStorage.clear();
    if (biometricFlag === "1") {
      await AsyncStorage.setItem("tablered-biometric-enabled", "1");
    }
    return response;
  } catch (error) {
    throw error;
  }
};
