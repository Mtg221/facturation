import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, UserPlus, Upload, ImageIcon } from 'lucide-react';
import societesService from '../../services/societes.service';

type Tab = 'infos' | 'users' | 'stats';

export default function SocieteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('infos');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', nom: '', prenom: '' });
  const [form, setForm] = useState<Record<string, string>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => societesService.uploadLogo(id!, file),
    onSuccess: () => {
      toast.success('Logo mis à jour');
      queryClient.invalidateQueries({ queryKey: ['societe', id] });
    },
    onError: () => toast.error("Erreur lors de l'upload"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => societesService.update(id!, data),
    onSuccess: () => {
      toast.success('Informations mises à jour');
      queryClient.invalidateQueries({ queryKey: ['societe', id] });
      setForm({});
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const createAdminMutation = useMutation({
    mutationFn: () => societesService.createAdmin(id!, adminForm),
    onSuccess: () => {
      toast.success('Admin créé — un email a été envoyé pour définir son mot de passe');
      setShowAdminForm(false);
      setAdminForm({ email: '', nom: '', prenom: '' });
      queryClient.invalidateQueries({ queryKey: ['societe-users', id] });
    },
    onError: () => toast.error('Erreur lors de la création'),
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

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700';

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} />
        Retour aux sociétés
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{societe.nom}</h1>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${societe.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {societe.isActive ? 'Active' : 'Inactive'}
          </span>
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
          {/* Logo */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {societe.logoUrl
                  ? <img src={societe.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  : <ImageIcon size={24} className="text-gray-300" />
                }
              </div>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoMutation.mutate(f); }}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload size={14} />
                  {uploadLogoMutation.isPending ? 'Upload...' : 'Choisir un logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, SVG — max 2 Mo</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={f.key} className={labelCls}>{f.label}{f.required ? ' *' : ''}</label>
                <input
                  id={f.key}
                  value={getValue(f.key)}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              onClick={() => { if (Object.keys(form).length > 0) updateMutation.mutate(form); }}
              disabled={updateMutation.isPending || Object.keys(form).length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={15} />
              {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="max-w-3xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{users.length} utilisateur(s)</span>
            <button
              onClick={() => setShowAdminForm(!showAdminForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus size={15} />
              Ajouter un admin
            </button>
          </div>

          {showAdminForm && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-sm text-blue-800 mb-3">Créer un administrateur</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Prénom"
                  value={adminForm.prenom}
                  onChange={(e) => setAdminForm((p) => ({ ...p, prenom: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Nom"
                  value={adminForm.nom}
                  onChange={(e) => setAdminForm((p) => ({ ...p, nom: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 col-span-2">Un email sera envoyé à l'admin pour qu'il définisse son mot de passe.</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => createAdminMutation.mutate()}
                  disabled={createAdminMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {createAdminMutation.isPending ? 'Création...' : 'Créer'}
                </button>
                <button
                  onClick={() => setShowAdminForm(false)}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
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
                  <span className="px-2.5 py-1 border border-gray-200 rounded-full text-xs text-gray-600">{u.role}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </span>
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
            { label: 'CA encaissé', value: `${Number(stats.chiffreAffaires).toLocaleString('fr-FR')} FCFA` },
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
