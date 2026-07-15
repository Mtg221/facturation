import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  COMPTABLE: 'bg-green-100 text-green-700',
  CAISSIER: 'bg-amber-100 text-amber-700',
  LECTURE: 'bg-gray-100 text-gray-600',
};

export function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.data;
    },
  });

  const users = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.meta?.total ?? 0} utilisateur(s)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dernière connexion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : users.map((u: { id: string; nom: string; prenom: string; email: string; role: string; isActive: boolean; lastLogin?: string }) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.prenom} {u.nom}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                  </tr>
                ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
