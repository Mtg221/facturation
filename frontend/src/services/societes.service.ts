import { api } from './api.service';

export interface Societe {
  id: string;
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  ninea?: string;
  rc?: string;
  banque?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    factures: number;
    clients: number;
  };
}

export interface SocieteStats {
  factures: number;
  clients: number;
  users: number;
  chiffreAffaires: number;
}

export interface PlatformStats {
  societes: number;
  users: number;
  factures: number;
  chiffreAffairesTotal: number;
}

export interface CreateSocietePayload {
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  ninea?: string;
  rc?: string;
  banque?: string;
  logoUrl?: string;
}

export interface CreateAdminPayload {
  email: string;
  nom: string;
  prenom: string;
  motDePasse: string;
}

const societesService = {
  findAll: async (): Promise<Societe[]> => {
    const res = await api.get('/societes');
    return res.data.data;
  },

  findOne: async (id: string): Promise<Societe> => {
    const res = await api.get(`/societes/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateSocietePayload): Promise<Societe> => {
    const res = await api.post('/societes', payload);
    return res.data.data;
  },

  update: async (id: string, payload: Partial<CreateSocietePayload>): Promise<Societe> => {
    const res = await api.patch(`/societes/${id}`, payload);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/societes/${id}`);
  },

  uploadLogo: async (societeId: string, file: File): Promise<Societe> => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post(`/societes/${societeId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  uploadMyLogo: async (file: File): Promise<Societe> => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post('/societes/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  createAdmin: async (societeId: string, payload: CreateAdminPayload) => {
    const res = await api.post(`/societes/${societeId}/admin`, payload);
    return res.data.data;
  },

  getSocieteUsers: async (societeId: string) => {
    const res = await api.get(`/societes/${societeId}/users`);
    return res.data.data;
  },

  getSocieteStats: async (societeId: string): Promise<SocieteStats> => {
    const res = await api.get(`/societes/${societeId}/stats`);
    return res.data.data;
  },

  getPlatformStats: async (): Promise<PlatformStats> => {
    const res = await api.get('/societes/platform/stats');
    return res.data.data;
  },

  getMySociete: async (): Promise<Societe> => {
    const res = await api.get('/societes/me/infos');
    return res.data.data;
  },

  updateMySociete: async (payload: Partial<CreateSocietePayload>): Promise<Societe> => {
    const res = await api.patch('/societes/me/infos', payload);
    return res.data.data;
  },
};

export default societesService;
