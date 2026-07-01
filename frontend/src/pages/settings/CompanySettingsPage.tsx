import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/auth.context';
import societesService from '../../services/societes.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const fields = [
  { key: 'nom', label: 'Nom de la société', required: true },
  { key: 'ninea', label: 'NINEA' },
  { key: 'rc', label: 'RCCM' },
  { key: 'adresse', label: 'Adresse' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'banque', label: 'Compte bancaire' },
  { key: 'logoUrl', label: 'URL du logo' },
];

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: societe, isLoading } = useQuery({
    queryKey: ['my-societe'],
    queryFn: () => societesService.findOne(user!.societeId!),
    enabled: !!user?.societeId,
  });

  const mutation = useMutation({
    mutationFn: societesService.updateMySociete,
    onSuccess: () => {
      toast.success('Informations de la société mises à jour');
      queryClient.invalidateQueries({ queryKey: ['my-societe'] });
      setForm({});
    },
  });

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;

  const getValue = (key: string) => {
    if (key in form) return form[key];
    return ((societe ?? {}) as Record<string, unknown>)[key] as string ?? '';
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Building2 size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma société</h1>
          <p className="text-gray-500 text-sm">Informations utilisées sur les factures et reçus PDF</p>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5"
      >
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

        <div className="pt-2">
          <Button type="submit" disabled={mutation.isPending || Object.keys(form).length === 0}>
            <Save size={15} className="mr-2" />
            {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
}
