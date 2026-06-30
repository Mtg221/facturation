import api from './api.service';
import type { Facture, CreateFacturePayload } from '../types/facture.types';

export const facturesService = {
  async findAll(params?: Record<string, string | number | undefined>) {
    const { data } = await api.get('/factures', { params });
    return data.data;
  },

  async findOne(id: string): Promise<Facture> {
    const { data } = await api.get(`/factures/${id}`);
    return data.data;
  },

  async create(payload: CreateFacturePayload): Promise<Facture> {
    const { data } = await api.post('/factures', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateFacturePayload>): Promise<Facture> {
    const { data } = await api.patch(`/factures/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/factures/${id}`);
  },

  async duplicate(id: string): Promise<Facture> {
    const { data } = await api.post(`/factures/${id}/duplicate`);
    return data.data;
  },

  async getPdf(id: string, numero: string): Promise<void> {
    const response = await api.get(`/factures/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${numero}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
