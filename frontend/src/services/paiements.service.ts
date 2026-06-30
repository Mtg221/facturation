import api from './api.service';

export const paiementsService = {
  async findAll(params?: Record<string, string | number | undefined>) {
    const { data } = await api.get('/paiements', { params });
    return data.data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/paiements/${id}`);
    return data.data;
  },

  async create(payload: {
    factureId: string;
    montant: number;
    mode: string;
    datePaiement?: string;
    reference?: string;
    commentaire?: string;
  }) {
    const { data } = await api.post('/paiements', payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/paiements/${id}`);
  },

  async getRecu(id: string): Promise<void> {
    const response = await api.get(`/paiements/${id}/recu`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
