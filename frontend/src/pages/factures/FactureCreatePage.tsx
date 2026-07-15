import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMemo, useEffect } from 'react';
import { facturesService } from '../../services/factures.service';
import { clientsService } from '../../services/clients.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatCurrency } from '../../utils/format-currency';
import api from '../../services/api.service';

const detailSchema = z.object({
  produitId: z.string().optional(),
  designation: z.string().min(1, 'Requis'),
  observation: z.string().optional(),
  quantite: z.coerce.number().positive('> 0'),
  prixUnitaire: z.coerce.number().min(0),
  tva: z.coerce.number().min(0).max(100).default(18),
  remise: z.coerce.number().min(0).max(100).default(0),
});

const factureSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  dateEcheance: z.string().min(1, 'Date d\'échéance requise'),
  remiseGlobale: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  conditionsPaiement: z.string().optional(),
  details: z.array(detailSchema).min(1, 'Au moins une ligne requise'),
});

type FactureFormData = z.infer<typeof factureSchema>;

export function FactureCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: facture, isLoading: isLoadingFacture } = useQuery({
    queryKey: QUERY_KEYS.FACTURE(id!),
    queryFn: () => facturesService.findOne(id!),
    enabled: isEdit,
  });

  const { data: clientsData } = useQuery({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: () => clientsService.findAll({ limit: 200 }),
  });

  const { data: produitsData } = useQuery({
    queryKey: QUERY_KEYS.PRODUITS,
    queryFn: async () => {
      const { data } = await api.get('/produits?limit=200');
      return data.data;
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FactureFormData>({
    resolver: zodResolver(factureSchema),
    defaultValues: {
      details: [{ designation: '', observation: '', quantite: 1, prixUnitaire: 0, tva: 18, remise: 0 }],
      remiseGlobale: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'details' });

  useEffect(() => {
    if (!facture) return;
    reset({
      clientId: facture.clientId,
      dateEcheance: facture.dateEcheance?.slice(0, 10) ?? '',
      remiseGlobale: Number(facture.remiseGlobale ?? 0),
      notes: facture.notes ?? '',
      conditionsPaiement: facture.conditionsPaiement ?? '',
      details: (facture.details ?? []).map((d) => ({
        produitId: d.produitId ?? undefined,
        designation: d.designation,
        observation: d.observation ?? '',
        quantite: Number(d.quantite),
        prixUnitaire: Number(d.prixUnitaire),
        tva: Number(d.tva),
        remise: Number(d.remise ?? 0),
      })),
    });
  }, [facture, reset]);
  const watchedDetails = watch('details');
  const watchedRemise = watch('remiseGlobale');

  const totals = useMemo(() => {
    let montantHT = 0;
    let montantTVA = 0;

    (watchedDetails ?? []).forEach((d) => {
      if (!d.quantite || !d.prixUnitaire) return;
      const ht = d.quantite * d.prixUnitaire * (1 - (d.remise ?? 0) / 100);
      const tva = ht * (d.tva ?? 0) / 100;
      montantHT += ht;
      montantTVA += tva;
    });

    const remise = (watchedRemise ?? 0) / 100;
    montantHT = montantHT * (1 - remise);
    montantTVA = montantTVA * (1 - remise);

    return { montantHT, montantTVA, montantTTC: montantHT + montantTVA };
  }, [watchedDetails, watchedRemise]);

  const createMutation = useMutation({
    mutationFn: facturesService.create,
    onSuccess: (facture) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      toast.success(`Facture ${facture.numero} créée`);
      navigate(`/factures/${facture.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FactureFormData) => facturesService.update(id!, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURE(id!) });
      toast.success(`Facture ${updated.numero} modifiée`);
      navigate(`/factures/${updated.id}`);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FactureFormData) =>
    isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);

  const clients = clientsData?.data ?? [];
  const produits = produitsData?.data ?? [];

  const handleProduitChange = (index: number, produitId: string) => {
    const produit = produits.find((p: { id: string }) => p.id === produitId);
    if (produit) {
      setValue(`details.${index}.designation`, produit.designation);
      setValue(`details.${index}.prixUnitaire`, Number(produit.prix));
      setValue(`details.${index}.tva`, Number(produit.tva));
    }
  };

  if (isEdit && isLoadingFacture) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isEdit && facture && facture.statut !== 'BROUILLON') {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">
          Seules les factures en brouillon peuvent être modifiées.
        </p>
        <Link to={`/factures/${facture.id}`} className="text-blue-600 hover:underline text-sm">
          Retour à la facture
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/factures" className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Retour à la liste des factures">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? `Modifier la facture ${facture?.numero ?? ''}` : 'Nouvelle facture'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                {...register('clientId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c: { id: string; nom: string; code: string }) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance *</label>
              <input
                {...register('dateEcheance')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
              {errors.dateEcheance && (
                <p className="text-red-500 text-xs mt-1">{errors.dateEcheance.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions de paiement</label>
              <input
                {...register('conditionsPaiement')}
                placeholder="Ex: Paiement à 30 jours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remise globale (%)</label>
              <input
                {...register('remiseGlobale')}
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Lignes de facture</h2>
            <button
              type="button"
              onClick={() => append({ designation: '', observation: '', quantite: 1, prixUnitaire: 0, tva: 18, remise: 0 })}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={15} />
              Ajouter une ligne
            </button>
          </div>

          <div className="overflow-x-auto">
          <div className="min-w-[760px] space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-2">Produit</div>
              <div className="col-span-2">Désignation *</div>
              <div className="col-span-2">Observation</div>
              <div className="col-span-1">Qté</div>
              <div className="col-span-2">Prix HT</div>
              <div className="col-span-1">TVA%</div>
              <div className="col-span-1">Rem%</div>
              <div className="col-span-1 text-right">Total TTC</div>
            </div>

            {fields.map((field, index) => {
              const d = watchedDetails?.[index];
              const ht = (d?.quantite ?? 0) * (d?.prixUnitaire ?? 0) * (1 - (d?.remise ?? 0) / 100);
              const ttc = ht * (1 + (d?.tva ?? 0) / 100);

              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2">
                    <select
                      onChange={(e) => handleProduitChange(index, e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Ligne libre</option>
                      {produits.map((p: { id: string; designation: string }) => (
                        <option key={p.id} value={p.id}>{p.designation}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`details.${index}.designation`)}
                      placeholder="Désignation"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`details.${index}.observation`)}
                      placeholder="Observation (libre)"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      {...register(`details.${index}.quantite`)}
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`details.${index}.prixUnitaire`)}
                      type="number"
                      step="1"
                      min="0"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      {...register(`details.${index}.tva`)}
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      {...register(`details.${index}.remise`)}
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatCurrency(ttc)}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total HT</span>
                <span className="font-medium">{formatCurrency(totals.montantHT)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>TVA</span>
                <span className="font-medium">{formatCurrency(totals.montantTVA)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                <span>Total TTC</span>
                <span>{formatCurrency(totals.montantTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/factures"
            className="px-6 py-2.5 text-sm border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-2.5 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#2d5f8a] disabled:opacity-60 transition-colors"
          >
            {isPending
              ? 'Enregistrement...'
              : isEdit
                ? 'Enregistrer les modifications'
                : 'Créer la facture'}
          </button>
        </div>
      </form>
    </div>
  );
}
