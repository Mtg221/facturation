import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsService } from '../../../services/clients.service';
import api from '../../../services/api.service';
import type { Client } from '../../../types/client.types';

const clientSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone1: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  ninea: z.string().optional(),
  commentaire: z.string().optional(),
  secteurIds: z.array(z.string()).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const { data: secteursData } = useQuery({
    queryKey: ['secteurs'],
    queryFn: async () => {
      const { data } = await api.get('/secteurs?limit=100');
      return data.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: client?.nom ?? '',
      email: client?.email ?? '',
      telephone1: client?.telephone1 ?? '',
      adresse: client?.adresse ?? '',
      ville: client?.ville ?? '',
      pays: client?.pays ?? 'Sénégal',
      ninea: client?.ninea ?? '',
      commentaire: client?.commentaire ?? '',
      secteurIds: client?.secteurs?.map((cs) => cs.secteur.id) ?? [],
    },
  });

  const createMutation = useMutation({
    mutationFn: clientsService.create,
    onSuccess: () => { toast.success('Client créé'); onSuccess(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ClientFormData) => clientsService.update(client!.id, data),
    onSuccess: () => { toast.success('Client modifié'); onSuccess(); },
  });

  const onSubmit = (data: ClientFormData) => {
    if (client) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const secteurs = secteursData?.data ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {client ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Raison sociale *</label>
              <input
                {...register('nom')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                {...register('telephone1')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                {...register('adresse')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                {...register('ville')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <input
                {...register('pays')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NINEA</label>
              <input
                {...register('ninea')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secteurs d'activité</label>
              <select
                {...register('secteurIds')}
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 h-24"
              >
                {secteurs.map((s: { id: string; nom: string }) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <textarea
                {...register('commentaire')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2d5f8a] disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Enregistrement...' : client ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
