import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import societesService from '../../services/societes.service';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function SocietesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: societes = [], isLoading } = useQuery({
    queryKey: ['societes'],
    queryFn: societesService.findAll,
  });

  const removeMutation = useMutation({
    mutationFn: societesService.remove,
    onSuccess: () => {
      toast.success('Société désactivée');
      queryClient.invalidateQueries({ queryKey: ['societes'] });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sociétés</h1>
          <p className="text-gray-500 mt-1">{societes.length} société(s) enregistrée(s)</p>
        </div>
        <Button onClick={() => navigate(ROUTES.SUPERADMIN_SOCIETE_CREATE)}>
          <Plus size={16} className="mr-2" />
          Nouvelle société
        </Button>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : (
        <div className="grid gap-4">
          {societes.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(ROUTES.SUPERADMIN_SOCIETE_DETAIL.replace(':id', s.id))}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{s.nom}</div>
                  <div className="text-sm text-gray-500">{s.adresse ?? '—'}</div>
                  {s.ninea && <div className="text-xs text-gray-400">NINEA : {s.ninea}</div>}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users size={14} />
                  <span>{s._count?.users ?? 0}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <FileText size={14} />
                  <span>{s._count?.factures ?? 0}</span>
                </div>
                <Badge variant={s.isActive ? 'default' : 'secondary'}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <button
                  onClick={(e) => { e.stopPropagation(); removeMutation.mutate(s.id); }}
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Désactiver"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {societes.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune société enregistrée</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
