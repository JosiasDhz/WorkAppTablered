import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = "http://192.168.0.227:9005";

const setupAxiosInterceptors = async () => {
  let token = await AsyncStorage.getItem("tablered-token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

const http = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    Authorization: "Bearer " + AsyncStorage.getItem("tablered-token"),
    "Content-type": "application/json",
  },
});
 
// Interceptor para configurar el token de autorización
http.interceptors.request.use(
  async function (config) {
    let token = await AsyncStorage.getItem("tablered-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ajustar Content-Type si se está enviando FormData
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
http.interceptors.response.use(
  (response) => {
    return response;
  },
  function (error) {
    if (error.response) {
      const status = error.response.status;
      return Promise.reject(error.response.data);
    } else {
      return Promise.reject({
        status: 500,
        message: "Error de conexión con el servidor.",
      });
    }
  }
);

const httpFormDataClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

httpFormDataClient.interceptors.request.use(
  async function (config) {
    let token = await AsyncStorage.getItem("tablered-token");

    config.headers["Content-Type"] = "multipart/form-data";

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default http;
export { httpFormDataClient };
