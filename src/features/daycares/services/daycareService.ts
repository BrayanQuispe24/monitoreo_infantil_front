import { api } from "../../../api/axios";
import type { Area, DaycareRegister, DaycareRegisterResponse, DaycareUpdate } from "../interfaces/Daycare.interface";

export const DaycareService = {
    listarGuarderias: async (): Promise<DaycareRegisterResponse[]> => {
        try {
            const response = await api.get('/api/daycares');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    registrarGuarderia: async (data: DaycareRegister): Promise<DaycareRegisterResponse> => {
        try {
            const response = await api.post('/api/daycares', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    actualizarGuarderia: async (code: string, data: DaycareUpdate): Promise<DaycareRegisterResponse> => {
        try {
            const response = await api.put(`/api/daycares/${code}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    actualizarGuarderiaArea: async (code: string, data: Area): Promise<DaycareRegisterResponse> => {
        try {
            const response = await api.put(`/api/daycares/${code}/area`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    obtenerGuarderia: async (code: string): Promise<DaycareRegisterResponse> => {
        try {
            const response = await api.get(`/api/daycares/${code}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}