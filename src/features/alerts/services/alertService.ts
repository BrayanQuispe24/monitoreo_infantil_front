import { api } from "../../../api/axios";
import type { AlertResponse, AlertStatus } from "../interfaces/Alert.interface";

export interface AlertQueryParams {
  child_code?: string;
  daycare_code?: string;
  daycare_id?: string;
  status?: AlertStatus;
}

export const AlertService = {
  listAlerts: async (params?: AlertQueryParams): Promise<AlertResponse[]> => {
    try {
      const response = await api.get("/api/alerts", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsViewed: async (alertCode: string): Promise<AlertResponse> => {
    try {
      const response = await api.patch(`/api/alerts/${alertCode}/viewed`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsResolved: async (alertCode: string): Promise<AlertResponse> => {
    try {
      const response = await api.patch(`/api/alerts/${alertCode}/resolved`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
