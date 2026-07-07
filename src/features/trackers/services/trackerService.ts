import { api } from "../../../api/axios";
import type { 
  PairingCodeResponse, 
  PairingCodeListResponse, 
  ChildTrackerResponse 
} from "../interfaces/Tracker.interface";

export const TrackerService = {
  generatePairingCode: async (childCode: string, expiresInMinutes: number = 10): Promise<PairingCodeResponse> => {
    try {
      const response = await api.post("/api/tracking-devices/pairing-codes", {
        child_code: childCode,
        expires_in_minutes: expiresInMinutes
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  listPairingCodes: async (childCode: string): Promise<PairingCodeListResponse[]> => {
    try {
      const response = await api.get("/api/tracking-devices/pairing-codes", {
        params: { child_code: childCode }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  cancelPairingCode: async (pairingCode: string): Promise<void> => {
    try {
      await api.patch(`/api/tracking-devices/pairing-codes/${pairingCode}/cancel`);
    } catch (error) {
      throw error;
    }
  },

  getTrackerForChild: async (childCode: string): Promise<ChildTrackerResponse> => {
    try {
      const response = await api.get(`/api/tracking-devices/children/${childCode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  decoupleTracker: async (childCode: string): Promise<void> => {
    try {
      await api.delete(`/api/tracking-devices/children/${childCode}`);
    } catch (error) {
      throw error;
    }
  }
};
