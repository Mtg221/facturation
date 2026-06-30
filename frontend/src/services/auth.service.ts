import api, { setAccessToken } from './api.service';
import type { AuthResponse, LoginPayload } from '../types/auth.types';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', payload, {
      withCredentials: true,
    });
    return data.data;
  },

  async register(payload: {
    email: string;
    nom: string;
    prenom: string;
    motDePasse: string;
  }): Promise<AuthResponse> {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/register', payload, {
      withCredentials: true,
    });
    return data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } finally {
      setAccessToken(null);
    }
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },
};
