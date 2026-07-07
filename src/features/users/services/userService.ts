import { api } from "../../../api/axios";
import type { UserRegister, UserResponse, UserUpdate } from "../interfaces/User.interface";

export const UserService = {
  listarUsuarios: async (): Promise<UserResponse[]> => {
    try {
      const response = await api.get("/api/auth/users");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  crearUsuario: async (data: UserRegister): Promise<UserResponse> => {
    try {
      const response = await api.post("/api/auth/register", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  actualizarUsuario: async (user_id: string, data: UserUpdate): Promise<UserResponse> => {
    try {
      const response = await api.put(`/api/auth/users/${user_id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
