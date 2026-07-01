import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Building2, Upload, ImageIcon, Pencil, X } from 'lucide-react';
import { useAuth } from '../../contexts/auth.context';
import societesService from '../../services/societes.service';

const fields = [
  { key: 'nom', label: 'Nom de la société', required: true },
  { key: 'ninea', label: 'NINEA' },
  { key: 'rc', label: 'RCCM' },
  { key: 'adresse', label: 'Adresse' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'banque', label: 'Compte bancaire' },
];

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: societe, isLoading } = useQuery({
    queryKey: ['my-societe'],
    queryFn: () => societesService.getMySociete(),
    enabled: !!user?.societeId,
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => societesService.uploadMyLogo(file),
    onSuccess: () => {
      toast.success('Logo mis à jour');
      queryClient.invalidateQueries({ queryKey: ['my-societe'] });
    },
    onError: () => toast.error("Erreur lors de l'upload"),
  });

  const mutation = useMutation({
    mutationFn: societesService.updateMySociete,
    onSuccess: () => {
      toast.success('Informations mises à jour');
      queryClient.invalidateQueries({ queryKey: ['my-societe'] });
      setForm({});
      setEditing(false);
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;

  const getValue = (key: string) => {
    if (editing && key in form) return form[key];
    return ((societe ?? {}) as Record<string, unknown>)[key] as string ?? '';
  };

  const handleCancel = () => {
    setForm({});
    setEditing(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ma société</h1>
            <p className="text-gray-500 text-sm">Informations utilisées sur les factures et reçus PDF</p>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil size={14} />
            Modifier
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <X size={14} />
            Annuler
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Logo */}
        <div className="pb-5 border-b border-gray-100">
          <p className="block text-sm font-medium text-gray-700 mb-2">Logo</p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              {societe?.logoUrl
                ? <img src={societe.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                : <ImageIcon size={24} className="text-gray-300" />
              }
            </div>
            {editing && (
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoMutation.mutate(f); }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload size={14} />
                  {uploadLogoMutation.isPending ? 'Upload...' : 'Changer le logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, SVG — max 2 Mo</p>
              </div>
            )}
          </div>
        </div>

        {/* Fields */}
        {fields.map((f) => (
          <div key={f.key}>
            <p className="block text-sm font-medium text-gray-500 mb-1">{f.label}</p>
            {editing ? (
              <input
                id={f.key}
                value={getValue(f.key)}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 text-sm py-2">
                {getValue(f.key) || <span className="text-gray-400 italic">Non renseigné</span>}
              </p>
            )}
          </div>
        ))}

        {/* Save button */}
        {editing && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => { if (Object.keys(form).length > 0) mutation.mutate(form); }}
              disabled={mutation.isPending || Object.keys(form).length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={15} />
              {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
