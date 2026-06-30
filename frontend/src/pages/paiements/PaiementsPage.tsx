import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paiementsService } from '../../services/paiements.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';
import { formatCurrency } from '../../utils/format-currency';
import { Download } from 'lucide-react';

const MODE_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  CARTE: 'Carte',
  MOBILE_MONEY: 'Mobile Money',
};

export function PaiementsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.PAIEMENTS, page],
    queryFn: () => paiementsService.findAll({ page, limit: 20 }),
  });

  const paiements = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <p className="text-gray-500 text-sm mt-1">{meta?.total ?? 0} paiement(s)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Facture</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mode</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Montant</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : paiements.map((p: {
                  id: string;
                  datePaiement: string;
                  montant: number;
                  mode: string;
                  facture?: { numero: string; client?: { nom: string } };
                }) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.datePaiement)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                      {p.facture?.numero ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.facture?.client?.nom ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                        {MODE_LABELS[p.mode] ?? p.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {formatCurrency(Number(p.montant))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => paiementsService.getRecu(p.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Télécharger le reçu"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} sur {meta.total}
            </p>
            <div className="flex gap-2">
              <button disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Précédent</button>
              <button disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Suivant</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
