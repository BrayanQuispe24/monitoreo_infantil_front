import { api } from "../../../api/axios";
import type { ChildRegister, ChildResponse, ChildUpdate } from "../interfaces/Child.interface";

export const ChildService = {
  listarNinos: async (daycareId?: string): Promise<ChildResponse[]> => {
    try {
      const response = await api.get("/api/children", {
        params: daycareId ? { daycare_id: daycareId } : {},
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  crearNino: async (data: ChildRegister): Promise<ChildResponse> => {
    try {
      const response = await api.post("/api/children", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  actualizarNino: async (childCode: string, data: ChildUpdate): Promise<ChildResponse> => {
    try {
      const response = await api.put(`/api/children/${childCode}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  obtenerNino: async (childCode: string): Promise<ChildResponse> => {
    try {
      const response = await api.get(`/api/children/${childCode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
