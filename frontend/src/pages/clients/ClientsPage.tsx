import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsService } from '../../services/clients.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';
import { downloadBlob } from '../../utils/download-file';
import type { Client } from '../../types/client.types';
import { ClientForm } from '../../features/clients/components/ClientForm';

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.CLIENTS, { search, page }],
    queryFn: () => clientsService.findAll({ search, page, limit: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: clientsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
      toast.success('Client supprimé');
    },
  });

  const exportMutation = useMutation({
    mutationFn: clientsService.exportCsv,
    onSuccess: (blob) => downloadBlob(blob, 'clients.csv'),
  });

  const handleDelete = (client: Client) => {
    if (confirm(`Supprimer le client "${client.nom}" ?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const clients = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">
            {meta?.total ?? 0} client{(meta?.total ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Exporter CSV
          </button>
          <button
            onClick={() => { setEditingClient(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5f8a] transition-colors"
          >
            <Plus size={16} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher un client..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Téléphone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Factures</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Créé le</th>
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
                : clients.map((client: Client) => (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{client.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{client.nom}</td>
                      <td className="px-4 py-3 text-gray-600">{client.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{client.telephone1 ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{client.ville ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                          {client._count?.factures ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(client.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/clients/${client.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            onClick={() => { setEditingClient(client); setShowForm(true); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
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

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-gray-50">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
              ))
            : clients.length === 0
              ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Aucun client
                  </div>
                )
              : clients.map((client: Client) => (
                  <div key={client.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-gray-500">{client.code}</div>
                        <div className="font-medium text-gray-900 truncate">{client.nom}</div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {client._count?.factures ?? 0} facture(s)
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="col-span-2">
                        <dt className="text-xs text-gray-500">Email</dt>
                        <dd className="text-gray-700 truncate">{client.email ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Téléphone</dt>
                        <dd className="text-gray-700">{client.telephone1 ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Ville</dt>
                        <dd className="text-gray-700">{client.ville ?? '—'}</dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-50 pt-2">
                      <Link
                        to={`/clients/${client.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => { setEditingClient(client); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
        </div>

        {/* Pagination */}
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

      {/* Form Modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => { setShowForm(false); setEditingClient(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CLIENTS });
            setShowForm(false);
            setEditingClient(null);
          }}
        />
      )}
    </div>
  );
}
