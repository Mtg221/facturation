import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatCurrency } from '../../utils/format-currency';
import { formatDate } from '../../utils/format-date';

export function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [dateDebut, setDateDebut] = useState(firstOfMonth);
  const [dateFin, setDateFin] = useState(today.toISOString().split('T')[0]);
  const [tab, setTab] = useState<'revenue' | 'impayes'>('revenue');

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: [...QUERY_KEYS.REPORTS_REVENUE, dateDebut, dateFin],
    queryFn: async () => {
      const { data } = await api.get('/reports/revenue', { params: { dateDebut, dateFin } });
      return data.data;
    },
    enabled: tab === 'revenue',
  });

  const { data: impayesData, isLoading: loadingImpayes } = useQuery({
    queryKey: QUERY_KEYS.REPORTS_IMPAYES,
    queryFn: async () => {
      const { data } = await api.get('/reports/impayes');
      return data.data;
    },
    enabled: tab === 'impayes',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-500 text-sm mt-1">Analyses et exports comptables</p>
      </div>

      <div className="flex gap-2">
        {(['revenue', 'impayes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'revenue' ? 'Chiffre d\'affaires' : 'Impayés'}
          </button>
        ))}
      </div>

      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
          </div>

          {revenueData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total HT', value: revenueData.synthese.totalHT },
                { label: 'TVA collectée', value: revenueData.synthese.totalTVA },
                { label: 'Total TTC', value: revenueData.synthese.totalTTC },
                { label: 'Encaissé', value: revenueData.synthese.totalEncaisse },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(kpi.value)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Facture</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">HT</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">TTC</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Encaissé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingRevenue
                  ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
                  : (revenueData?.factures ?? []).map((f: { id: string; numero: string; client?: { nom: string }; dateEmission: string; montantHT: number; montantTTC: number; montantPaye: number }) => (
                      <tr key={f.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{f.numero}</td>
                        <td className="px-4 py-3">{f.client?.nom}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(f.dateEmission)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(Number(f.montantHT))}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(f.montantTTC))}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-semibold">{formatCurrency(Number(f.montantPaye))}</td>
                      </tr>
                    ))}
              </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-50">
              {loadingRevenue
                ? <div className="p-8 text-center text-gray-400">Chargement...</div>
                : (revenueData?.factures ?? []).length === 0
                  ? <div className="p-6 text-center text-sm text-gray-500">Aucune facture</div>
                  : (revenueData?.factures ?? []).map((f: { id: string; numero: string; client?: { nom: string }; dateEmission: string; montantHT: number; montantTTC: number; montantPaye: number }) => (
                      <div key={f.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-semibold">{f.numero}</div>
                            <div className="text-gray-700 truncate">{f.client?.nom}</div>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{formatDate(f.dateEmission)}</span>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <dt className="text-xs text-gray-500">HT</dt>
                            <dd>{formatCurrency(Number(f.montantHT))}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">TTC</dt>
                            <dd className="font-semibold">{formatCurrency(Number(f.montantTTC))}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-gray-500">Encaissé</dt>
                            <dd className="text-green-700 font-semibold">{formatCurrency(Number(f.montantPaye))}</dd>
                          </div>
                        </dl>
                      </div>
                    ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'impayes' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Facture</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Échéance</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Reste à payer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingImpayes
                ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Chargement...</td></tr>
                : (impayesData ?? []).map((f: { id: string; numero: string; client?: { nom: string; telephone1?: string; email?: string }; dateEcheance: string; resteAPayer: number; statut: string }) => (
                    <tr key={f.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{f.numero}</td>
                      <td className="px-4 py-3 font-medium">{f.client?.nom}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{f.client?.telephone1 ?? f.client?.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(f.dateEcheance)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(Number(f.resteAPayer))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${f.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {f.statut.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-50">
            {loadingImpayes
              ? <div className="p-8 text-center text-gray-400">Chargement...</div>
              : (impayesData ?? []).length === 0
                ? <div className="p-6 text-center text-sm text-gray-500">Aucun impayé</div>
                : (impayesData ?? []).map((f: { id: string; numero: string; client?: { nom: string; telephone1?: string; email?: string }; dateEcheance: string; resteAPayer: number; statut: string }) => (
                    <div key={f.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-semibold">{f.numero}</div>
                          <div className="font-medium text-gray-900 truncate">{f.client?.nom}</div>
                          <div className="text-xs text-gray-500 truncate">{f.client?.telephone1 ?? f.client?.email ?? '—'}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${f.statut === 'EN_RETARD' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {f.statut.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-500">Échéance {formatDate(f.dateEcheance)}</span>
                        <span className="font-bold text-red-600">{formatCurrency(Number(f.resteAPayer))}</span>
                      </div>
                    </div>
                  ))}
          </div>
        </div>
      )}
    </div>
  );
}
