import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // No login, 401 significa senha errada, não sessão expirada: a tela mostra o erro
        const ehLogin = originalRequest.url?.endsWith("/authentication/token/");

        if (error.response?.status === 401 && !originalRequest._retry && !ehLogin) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem(REFRESH_TOKEN);

                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/authentication/token/refresh/`, {
                    refresh: refreshToken,
                });

                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem(ACCESS_TOKEN);
                localStorage.removeItem(REFRESH_TOKEN);
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
