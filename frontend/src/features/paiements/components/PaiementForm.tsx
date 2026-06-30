import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { paiementsService } from '../../../services/paiements.service';
import { formatCurrency } from '../../../utils/format-currency';

const paiementSchema = z.object({
  montant: z.coerce.number().positive('Montant requis'),
  mode: z.enum(['ESPECES', 'VIREMENT', 'CHEQUE', 'CARTE', 'MOBILE_MONEY']),
  datePaiement: z.string().optional(),
  reference: z.string().optional(),
  commentaire: z.string().optional(),
});

type PaiementFormData = z.infer<typeof paiementSchema>;

interface PaiementFormProps {
  factureId: string;
  resteAPayer: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaiementForm({ factureId, resteAPayer, onClose, onSuccess }: PaiementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaiementFormData>({
    resolver: zodResolver(paiementSchema),
    defaultValues: {
      montant: resteAPayer,
      mode: 'VIREMENT',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PaiementFormData) =>
      paiementsService.create({ ...data, factureId }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Enregistrer un paiement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-4">
          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
            Reste à payer : <strong>{formatCurrency(resteAPayer)}</strong>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
            <input
              {...register('montant')}
              type="number"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
            />
            {errors.montant && <p className="text-red-500 text-xs mt-1">{errors.montant.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
            <select
              {...register('mode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
            >
              <option value="ESPECES">Espèces</option>
              <option value="VIREMENT">Virement bancaire</option>
              <option value="CHEQUE">Chèque</option>
              <option value="CARTE">Carte bancaire</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement</label>
            <input
              {...register('datePaiement')}
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input
              {...register('reference')}
              placeholder="N° virement, chèque..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
            <textarea
              {...register('commentaire')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Enregistrement...' : 'Valider le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
