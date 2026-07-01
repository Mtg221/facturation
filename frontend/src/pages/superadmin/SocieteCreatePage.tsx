import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import societesService, { CreateSocietePayload } from '../../services/societes.service';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function SocieteCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateSocietePayload>({ nom: '' });

  const mutation = useMutation({
    mutationFn: societesService.create,
    onSuccess: (societe) => {
      toast.success('Société créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['societes'] });
      navigate(ROUTES.SUPERADMIN_SOCIETE_DETAIL.replace(':id', societe.id));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Nouvelle société</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <Label htmlFor="nom">Nom de la société *</Label>
          <Input id="nom" name="nom" value={form.nom} onChange={handleChange} required className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ninea">NINEA</Label>
            <Input id="ninea" name="ninea" value={form.ninea ?? ''} onChange={handleChange} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="rc">RCCM</Label>
            <Input id="rc" name="rc" value={form.rc ?? ''} onChange={handleChange} className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="adresse">Adresse</Label>
          <Input id="adresse" name="adresse" value={form.adresse ?? ''} onChange={handleChange} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input id="telephone" name="telephone" value={form.telephone ?? ''} onChange={handleChange} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={form.email ?? ''} onChange={handleChange} className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="banque">Compte bancaire</Label>
          <Input id="banque" name="banque" value={form.banque ?? ''} onChange={handleChange} className="mt-1" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Création...' : 'Créer la société'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
