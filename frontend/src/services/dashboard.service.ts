import api from './api.service';

export const dashboardService = {
  async getKpis() {
    const { data } = await api.get('/dashboard/kpis');
    return data.data;
  },

  async getRevenueChart(year?: number) {
    const { data } = await api.get('/dashboard/revenue-chart', { params: { year } });
    return data.data;
  },

  async getPaymentStatus() {
    const { data } = await api.get('/dashboard/payment-status');
    return data.data;
  },

  async getTopClients(limit = 10) {
    const { data } = await api.get('/dashboard/top-clients', { params: { limit } });
    return data.data;
  },
};
