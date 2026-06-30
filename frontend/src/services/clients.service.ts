import api from './api.service';
import type { Client, CreateClientPayload } from '../types/client.types';

export const clientsService = {
  async findAll(params?: Record<string, string | number | boolean | undefined>) {
    const { data } = await api.get('/clients', { params });
    return data.data;
  },

  async findOne(id: string): Promise<Client> {
    const { data } = await api.get(`/clients/${id}`);
    return data.data;
  },

  async create(payload: CreateClientPayload): Promise<Client> {
    const { data } = await api.post('/clients', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateClientPayload>): Promise<Client> {
    const { data } = await api.patch(`/clients/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get('/clients/export/csv', { responseType: 'blob' });
    return response.data;
  },
};
