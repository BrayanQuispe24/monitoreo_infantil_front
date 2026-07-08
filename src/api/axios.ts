import axios from "axios";

export const api = axios.create({
    baseURL: "http://54.242.59.206:8000",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

api.interceptors.request.use((config) => {
    try {
        const storedData = localStorage.getItem("authData");
        const token = storedData ? JSON.parse(storedData).token : null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error al obtener token de localStorage:", error);
        localStorage.removeItem("authData");
    }

    return config;
});