import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api.service';

export function SecteursPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['secteurs'],
    queryFn: async () => {
      const { data } = await api.get('/secteurs?limit=100');
      return data.data;
    },
  });

  const secteurs = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Secteurs d'activité</h1>
          <p className="text-gray-500 text-sm mt-1">{secteurs.length} secteur(s)</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2d5f8a]">
          <Plus size={16} />
          Nouveau secteur
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                <div className="h-5 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
            ))
          : secteurs.map((s: { id: string; nom: string; description?: string; _count?: { clients: number } }) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900">{s.nom}</h3>
                {s.description && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{s._count?.clients ?? 0} client(s)</p>
              </div>
            ))}
      </div>
    </div>
  );
}
