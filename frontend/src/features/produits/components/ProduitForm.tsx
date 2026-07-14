import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api.service';

const produitSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  designation: z.string().min(1, 'Désignation requise'),
  description: z.string().optional(),
  prix: z.coerce.number().positive('Le prix doit être supérieur à 0'),
  tva: z.coerce.number().min(0, 'TVA entre 0 et 100').max(100, 'TVA entre 0 et 100'),
  unite: z.string().min(1, 'Unité requise'),
});

type ProduitFormData = z.infer<typeof produitSchema>;

export interface Produit {
  id: string;
  reference: string;
  designation: string;
  description?: string;
  prix: number;
  tva: number;
  unite: string;
}

interface ProduitFormProps {
  produit: Produit | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProduitForm({ produit, onClose, onSuccess }: ProduitFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProduitFormData>({
    resolver: zodResolver(produitSchema),
    defaultValues: {
      reference: produit?.reference ?? '',
      designation: produit?.designation ?? '',
      description: produit?.description ?? '',
      prix: produit?.prix ?? 0,
      tva: produit?.tva ?? 18,
      unite: produit?.unite ?? 'unité',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProduitFormData) => api.post('/produits', data),
    onSuccess: () => { toast.success('Produit créé'); onSuccess(); },
    onError: () => toast.error('Erreur lors de la création du produit'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProduitFormData) => api.patch(`/produits/${produit!.id}`, data),
    onSuccess: () => { toast.success('Produit modifié'); onSuccess(); },
    onError: () => toast.error('Erreur lors de la modification du produit'),
  });

  const onSubmit = (data: ProduitFormData) => {
    if (produit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {produit ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Référence *</label>
              <input {...register('reference')} className={inputCls} />
              {errors.reference && <p className="text-red-500 text-xs mt-1">{errors.reference.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Unité</label>
              <input {...register('unite')} className={inputCls} />
              {errors.unite && <p className="text-red-500 text-xs mt-1">{errors.unite.message}</p>}
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Désignation *</label>
              <input {...register('designation')} className={inputCls} />
              {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Prix HT (FCFA) *</label>
              <input {...register('prix')} type="number" step="0.01" min="0" className={inputCls} />
              {errors.prix && <p className="text-red-500 text-xs mt-1">{errors.prix.message}</p>}
            </div>

            <div>
              <label className={labelCls}>TVA (%)</label>
              <input {...register('tva')} type="number" step="0.01" min="0" max="100" className={inputCls} />
              {errors.tva && <p className="text-red-500 text-xs mt-1">{errors.tva.message}</p>}
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea {...register('description')} rows={3} className={`${inputCls} resize-none`} />
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
              {isLoading ? 'Enregistrement...' : produit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
