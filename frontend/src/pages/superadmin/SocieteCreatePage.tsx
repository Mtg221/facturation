import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import societesService from '../../services/societes.service';
import type { CreateSocietePayload } from '../../services/societes.service';
import { ROUTES } from '../../constants/routes';

export default function SocieteCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateSocietePayload>({
    nom: '',
    admin: { email: '', motDePasse: '', nom: '', prenom: '' },
  });

  const mutation = useMutation({
    mutationFn: societesService.create,
    onSuccess: (societe) => {
      toast.success('Société créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['societes'] });
      navigate(ROUTES.SUPERADMIN_SOCIETE_DETAIL.replace(':id', societe.id));
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, admin: { ...prev.admin, [name]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700';

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nouvelle société</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label htmlFor="nom" className={labelCls}>Nom de la société *</label>
          <input id="nom" name="nom" value={form.nom} onChange={handleChange} required className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ninea" className={labelCls}>NINEA</label>
            <input id="ninea" name="ninea" value={form.ninea ?? ''} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label htmlFor="rc" className={labelCls}>RCCM</label>
            <input id="rc" name="rc" value={form.rc ?? ''} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div>
          <label htmlFor="adresse" className={labelCls}>Adresse</label>
          <input id="adresse" name="adresse" value={form.adresse ?? ''} onChange={handleChange} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="telephone" className={labelCls}>Téléphone</label>
            <input id="telephone" name="telephone" value={form.telephone ?? ''} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" name="email" type="email" value={form.email ?? ''} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div>
          <label htmlFor="banque" className={labelCls}>Compte bancaire</label>
          <input id="banque" name="banque" value={form.banque ?? ''} onChange={handleChange} className={inputCls} />
        </div>

        <div className="border-t border-gray-200 pt-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Administrateur de la société</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="admin-prenom" className={labelCls}>Prénom *</label>
              <input id="admin-prenom" name="prenom" value={form.admin.prenom} onChange={handleAdminChange} required minLength={2} className={inputCls} />
            </div>
            <div>
              <label htmlFor="admin-nom" className={labelCls}>Nom *</label>
              <input id="admin-nom" name="nom" value={form.admin.nom} onChange={handleAdminChange} required minLength={2} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="admin-email" className={labelCls}>Email *</label>
              <input id="admin-email" name="email" type="email" value={form.admin.email} onChange={handleAdminChange} required className={inputCls} />
            </div>
            <div>
              <label htmlFor="admin-motDePasse" className={labelCls}>Mot de passe *</label>
              <input id="admin-motDePasse" name="motDePasse" type="password" value={form.admin.motDePasse} onChange={handleAdminChange} required minLength={8} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {mutation.isPending ? 'Création...' : 'Créer la société'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
