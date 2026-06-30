import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { clientsService } from '../../services/clients.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: client, isLoading } = useQuery({
    queryKey: QUERY_KEYS.CLIENT(id!),
    queryFn: () => clientsService.findOne(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return <div>Client introuvable</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/clients" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.nom}</h1>
          <p className="text-gray-500 text-sm">{client.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Informations</h2>
            <div className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={15} className="text-gray-400" />
                  <span className="text-gray-600">{client.email}</span>
                </div>
              )}
              {client.telephone1 && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={15} className="text-gray-400" />
                  <span className="text-gray-600">{client.telephone1}</span>
                </div>
              )}
              {(client.adresse || client.ville) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-gray-400" />
                  <span className="text-gray-600">
                    {[client.adresse, client.ville, client.pays].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <FileText size={15} className="text-gray-400" />
                <span className="text-gray-600">
                  {client._count?.factures ?? 0} facture(s) &mdash; créé le {formatDate(client.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {client.secteurs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Secteurs d'activité</h2>
              <div className="flex flex-wrap gap-2">
                {client.secteurs.map((cs) => (
                  <span
                    key={cs.secteur.id}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium"
                  >
                    {cs.secteur.nom}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link
            to={`/factures?clientId=${client.id}`}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Voir les factures</span>
            <FileText size={16} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
