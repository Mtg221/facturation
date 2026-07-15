import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Download, Copy, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { facturesService } from '../../services/factures.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';
import { formatCurrency } from '../../utils/format-currency';
import type { Facture, StatutFacture } from '../../types/facture.types';

const STATUT_STYLES: Record<StatutFacture, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYEE: 'bg-blue-100 text-blue-700',
  PARTIELLEMENT_PAYEE: 'bg-amber-100 text-amber-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-gray-100 text-gray-500',
  EN_RETARD: 'bg-red-100 text-red-700',
};

const STATUT_LABELS: Record<StatutFacture, string> = {
  BROUILLON: 'Brouillon',
  ENVOYEE: 'Envoyée',
  PARTIELLEMENT_PAYEE: 'Part. payée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
  EN_RETARD: 'En retard',
};

export function FacturesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.FACTURES, { search, statut, page }],
    queryFn: () => facturesService.findAll({ search, statut: statut || undefined, page, limit: 20 }),
  });

  const duplicateMutation = useMutation({
    mutationFn: facturesService.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      toast.success('Facture dupliquée');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: facturesService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      toast.success('Facture supprimée');
    },
  });

  const factures = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-500 text-sm mt-1">{meta?.total ?? 0} facture(s)</p>
        </div>
        <Link
          to="/factures/nouvelle"
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5f8a] transition-colors"
        >
          <Plus size={16} />
          Nouvelle facture
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Numéro, client..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Numéro</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Émission</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Échéance</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Montant TTC</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Reste à payer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : factures.map((f: Facture) => (
                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                        {f.numero}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {f.client?.nom ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(f.dateEmission)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(f.dateEcheance)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatCurrency(Number(f.montantTTC))}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${Number(f.resteAPayer) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Number(f.resteAPayer))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUT_STYLES[f.statut]}`}>
                          {STATUT_LABELS[f.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/factures/${f.id}`}
                            title="Voir la facture"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <Eye size={15} />
                          </Link>
                          {f.statut === 'BROUILLON' && (
                            <Link
                              to={`/factures/${f.id}/modifier`}
                              title="Modifier la facture"
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors"
                            >
                              <Pencil size={15} />
                            </Link>
                          )}
                          <button
                            onClick={() => facturesService.getPdf(f.id, f.numero)}
                            title="Télécharger le PDF"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={() => duplicateMutation.mutate(f.id)}
                            title="Dupliquer la facture"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Copy size={15} />
                          </button>
                          {f.statut === 'BROUILLON' && (
                            <button
                              onClick={() => {
                                if (confirm('Supprimer cette facture ?')) deleteMutation.mutate(f.id);
                              }}
                              title="Supprimer la facture"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} sur {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
