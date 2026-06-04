import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://192.168.0.227:9005"
).replace(/\/$/, "");
const baseURL = apiBaseUrl;

const setupAxiosInterceptors = async () => {
  const token = await AsyncStorage.getItem("tablered-token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

const http = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use(
  async function (config) {
    const token = await AsyncStorage.getItem("tablered-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

http.interceptors.response.use(
  (response) => response,
  function (error) {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      status: 500,
      message: "Error de conexión con el servidor.",
    });
  },
);

const httpFormDataClient = axios.create({
  baseURL,
  timeout: 120000,
});

httpFormDataClient.interceptors.request.use(
  async function (config) {
    const token = await AsyncStorage.getItem("tablered-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

httpFormDataClient.interceptors.response.use(
  (response) => response,
  function (error) {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      status: 500,
      message: "Error de conexión con el servidor.",
    });
  },
);

export default http;
export { httpFormDataClient, setupAxiosInterceptors };
