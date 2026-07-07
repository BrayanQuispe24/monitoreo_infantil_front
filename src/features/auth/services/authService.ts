import { api } from "../../../api/axios";
import type { LoginData } from "../interfaces/LoginData.interface";
import type { LoginResponse } from "../interfaces/LoginResponse.interface";
import type { RegisterData } from "../interfaces/RegisterData.interface";
import type { RegisterResponse } from "../interfaces/RegisterResponse.interface";

export const AuthService = {
    login: async (data: LoginData): Promise<LoginResponse> => {
        try {
            const response = await api.post('/api/auth/login', data);
            return response.data;
        } catch (error) {
            //TODO: Manejar error
            throw error;
        }
    },
    register: async (data: RegisterData): Promise<RegisterResponse> => {
        try {
            const response = await api.post('/api/auth/register', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    logout: async (): Promise<void> => {
        try {
            await api.post('/api/auth/logout');
        } catch (error) {
            throw error;
        }
    }
}