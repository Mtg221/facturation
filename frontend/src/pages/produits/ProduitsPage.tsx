import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatCurrency } from '../../utils/format-currency';
import { ProduitForm } from '../../features/produits/components/ProduitForm';
import type { Produit } from '../../features/produits/components/ProduitForm';

export function ProduitsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.PRODUITS, search],
    queryFn: async () => {
      const { data } = await api.get('/produits', { params: { search } });
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/produits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUITS });
      toast.success('Produit supprimé');
    },
  });

  const produits = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits & Services</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.meta?.total ?? 0} produit(s)</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5f8a] transition-colors"
        >
          <Plus size={16} />
          Nouveau produit
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Référence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Désignation</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prix HT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">TVA</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Unité</th>
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
              : produits.map((p: Produit) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.reference}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.designation}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(p.prix)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.tva}%</td>
                    <td className="px-4 py-3 text-gray-600">{p.unite}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(p); setFormOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <ProduitForm
          produit={editing}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUITS });
          }}
        />
      )}
    </div>
  );
}
