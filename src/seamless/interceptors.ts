import axios, { type AxiosInstance } from "axios";
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.SEAMLESS_API_URL,
  headers: {
    "content-type": "application/json",
  },
});
axiosInstance.interceptors.request.use(
  (config: any) => {
    
    const tokenStorage = process.env.SEAMLESS_API_TOKEN
    config.headers["Authorization"] = "Bearer " + tokenStorage;
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;