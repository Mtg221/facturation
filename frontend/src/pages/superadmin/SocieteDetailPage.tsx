import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import societesService from '../../services/societes.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';

type Tab = 'infos' | 'users' | 'stats';

export default function SocieteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('infos');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', nom: '', prenom: '', motDePasse: '' });

  const { data: societe, isLoading } = useQuery({
    queryKey: ['societe', id],
    queryFn: () => societesService.findOne(id!),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['societe-users', id],
    queryFn: () => societesService.getSocieteUsers(id!),
    enabled: !!id && tab === 'users',
  });

  const { data: stats } = useQuery({
    queryKey: ['societe-stats', id],
    queryFn: () => societesService.getSocieteStats(id!),
    enabled: !!id && tab === 'stats',
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => societesService.update(id!, data),
    onSuccess: () => {
      toast.success('Informations mises à jour');
      queryClient.invalidateQueries({ queryKey: ['societe', id] });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: () => societesService.createAdmin(id!, adminForm),
    onSuccess: () => {
      toast.success('Admin créé avec succès');
      setShowAdminForm(false);
      setAdminForm({ email: '', nom: '', prenom: '', motDePasse: '' });
      queryClient.invalidateQueries({ queryKey: ['societe-users', id] });
    },
  });

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;
  if (!societe) return <div className="p-8 text-gray-500">Société introuvable</div>;

  const fields = [
    { key: 'nom', label: 'Nom', required: true },
    { key: 'ninea', label: 'NINEA' },
    { key: 'rc', label: 'RCCM' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'email', label: 'Email' },
    { key: 'banque', label: 'Compte bancaire' },
  ];

  const getValue = (key: string) => {
    if (key in form) return form[key];
    return (societe as Record<string, unknown>)[key] as string ?? '';
  };

  const handleSave = () => {
    if (Object.keys(form).length === 0) return;
    updateMutation.mutate(form);
  };

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} />
        Retour aux sociétés
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{societe.nom}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant={societe.isActive ? 'default' : 'secondary'}>
              {societe.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['infos', 'users', 'stats'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'infos' ? 'Informations' : t === 'users' ? 'Utilisateurs' : 'Statistiques'}
          </button>
        ))}
      </div>

      {/* Infos tab */}
      {tab === 'infos' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>{f.label}{f.required ? ' *' : ''}</Label>
                <Input
                  id={f.key}
                  value={getValue(f.key)}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} disabled={updateMutation.isPending || Object.keys(form).length === 0}>
              <Save size={15} className="mr-2" />
              {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="max-w-3xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{users.length} utilisateur(s)</span>
            <Button size="sm" onClick={() => setShowAdminForm(!showAdminForm)}>
              <UserPlus size={15} className="mr-2" />
              Ajouter un admin
            </Button>
          </div>

          {showAdminForm && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 space-y-3">
              <h3 className="font-semibold text-sm text-blue-800">Créer un administrateur</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Prénom" value={adminForm.prenom} onChange={(e) => setAdminForm((p) => ({ ...p, prenom: e.target.value }))} />
                <Input placeholder="Nom" value={adminForm.nom} onChange={(e) => setAdminForm((p) => ({ ...p, nom: e.target.value }))} />
                <Input placeholder="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
                <Input placeholder="Mot de passe" type="password" value={adminForm.motDePasse} onChange={(e) => setAdminForm((p) => ({ ...p, motDePasse: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => createAdminMutation.mutate()} disabled={createAdminMutation.isPending}>
                  {createAdminMutation.isPending ? 'Création...' : 'Créer'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdminForm(false)}>Annuler</Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y">
            {users.map((u: { id: string; prenom: string; nom: string; email: string; role: string; isActive: boolean }) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-gray-900">{u.prenom} {u.nom}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{u.role}</Badge>
                  <Badge variant={u.isActive ? 'default' : 'secondary'}>{u.isActive ? 'Actif' : 'Inactif'}</Badge>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Aucun utilisateur</div>
            )}
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
          {[
            { label: 'Factures', value: stats.factures },
            { label: 'Clients', value: stats.clients },
            { label: 'Utilisateurs', value: stats.users },
            { label: "CA encaissé", value: `${Number(stats.chiffreAffaires).toLocaleString('fr-FR')} FCFA` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
