import { api } from "../../../api/axios";
import type {
  GuardianCreateRequest,
  GuardianCreateResponse,
  GuardianAdminResponse,
  GuardianResetPinResponse,
  GuardianChildLinkRequest,
  LinkDaycareRequest,
} from "../interfaces/Guardian.interface";

export const GuardianService = {
  listarTutores: async (): Promise<GuardianAdminResponse[]> => {
    try {
      const response = await api.get("/api/guardians");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  crearTutor: async (data: GuardianCreateRequest): Promise<GuardianCreateResponse> => {
    try {
      const response = await api.post("/api/guardians", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetearPin: async (guardianCode: string): Promise<GuardianResetPinResponse> => {
    try {
      const response = await api.patch(`/api/guardians/${guardianCode}/reset-pin`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  vincularNino: async (guardianCode: string, data: GuardianChildLinkRequest): Promise<void> => {
    try {
      await api.post(`/api/guardians/${guardianCode}/link-child`, data);
    } catch (error) {
      throw error;
    }
  },

  vincularGuarderia: async (guardianCode: string, data: LinkDaycareRequest): Promise<void> => {
    try {
      await api.post(`/api/guardians/${guardianCode}/link-daycare`, data);
    } catch (error) {
      throw error;
    }
  },
};
