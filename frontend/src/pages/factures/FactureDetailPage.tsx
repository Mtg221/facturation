import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Copy, CreditCard, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { facturesService } from '../../services/factures.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';
import { formatCurrency } from '../../utils/format-currency';
import type { StatutFacture } from '../../types/facture.types';
import { PaiementForm } from '../../features/paiements/components/PaiementForm';

const STATUT_STYLES: Record<StatutFacture, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  ENVOYEE: 'bg-blue-100 text-blue-700',
  PARTIELLEMENT_PAYEE: 'bg-amber-100 text-amber-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-gray-100 text-gray-500',
  EN_RETARD: 'bg-red-100 text-red-700',
};

export function FactureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaiement, setShowPaiement] = useState(false);

  const { data: facture, isLoading } = useQuery({
    queryKey: QUERY_KEYS.FACTURE(id!),
    queryFn: () => facturesService.findOne(id!),
    enabled: !!id,
  });

  const duplicateMutation = useMutation({
    mutationFn: () => facturesService.duplicate(id!),
    onSuccess: (newFacture) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      toast.success('Facture dupliquée');
      navigate(`/factures/${newFacture.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!facture) return <div>Facture introuvable</div>;

  const canPay = ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'].includes(facture.statut);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/factures" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{facture.numero}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUT_STYLES[facture.statut]}`}>
              {facture.statut.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {facture.statut === 'BROUILLON' && (
            <Link
              to={`/factures/${facture.id}/modifier`}
              title="Modifier cette facture (brouillon uniquement)"
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={15} />
              Modifier
            </Link>
          )}
          <button
            onClick={() => facturesService.getPdf(facture.id, facture.numero)}
            title="Télécharger la facture en PDF"
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={15} />
            PDF
          </button>
          <button
            onClick={() => duplicateMutation.mutate()}
            title="Créer une copie de cette facture"
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Copy size={15} />
            Dupliquer
          </button>
          {canPay && (
            <button
              onClick={() => setShowPaiement(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <CreditCard size={15} />
              Enregistrer paiement
            </button>
          )}
        </div>
      </div>

      {/* Facture content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-semibold text-gray-900">{facture.client?.nom}</p>
              </div>
              <div>
                <p className="text-gray-500">Établi par</p>
                <p className="font-semibold">{facture.user?.prenom} {facture.user?.nom}</p>
              </div>
              <div>
                <p className="text-gray-500">Date d'émission</p>
                <p className="font-semibold">{formatDate(facture.dateEmission)}</p>
              </div>
              <div>
                <p className="text-gray-500">Date d'échéance</p>
                <p className="font-semibold">{formatDate(facture.dateEcheance)}</p>
              </div>
            </div>
          </div>

          {/* Lines */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Désignation</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Observation</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Qté</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Prix HT</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">TVA</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(facture.details ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">{d.designation}</td>
                    <td className="px-4 py-3 text-gray-600">{d.observation ?? '—'}</td>
                    <td className="px-4 py-3 text-center">{Number(d.quantite)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(d.prixUnitaire))}</td>
                    <td className="px-4 py-3 text-center">{Number(d.tva)}%</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(d.montantTTC))}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-50">
              {(facture.details ?? []).map((d) => (
                <div key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-medium text-gray-900">{d.designation}</div>
                    <span className="font-semibold shrink-0">{formatCurrency(Number(d.montantTTC))}</span>
                  </div>
                  {d.observation && (
                    <div className="text-xs text-gray-500 mt-1">{d.observation}</div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>Qté&nbsp;: {Number(d.quantite)}</span>
                    <span>Prix HT&nbsp;: {formatCurrency(Number(d.prixUnitaire))}</span>
                    <span>TVA&nbsp;: {Number(d.tva)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end p-4 border-t border-gray-100">
              <div className="w-56 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total HT</span>
                  <span>{formatCurrency(Number(facture.montantHT))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TVA</span>
                  <span>{formatCurrency(Number(facture.montantTVA))}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                  <span>Total TTC</span>
                  <span>{formatCurrency(Number(facture.montantTTC))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment status */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Statut du paiement</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total TTC</span>
                <span className="font-semibold">{formatCurrency(Number(facture.montantTTC))}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Déjà payé</span>
                <span className="font-semibold">{formatCurrency(Number(facture.montantPaye))}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold pt-2 border-t">
                <span>Reste à payer</span>
                <span>{formatCurrency(Number(facture.resteAPayer))}</span>
              </div>
            </div>

            {/* Payment progress */}
            <div className="mt-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (Number(facture.montantPaye) / Number(facture.montantTTC)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((Number(facture.montantPaye) / Number(facture.montantTTC)) * 100)}% payé
              </p>
            </div>
          </div>

          {/* Payments list */}
          {(facture.paiements ?? []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">Historique des paiements</h3>
              <div className="space-y-2">
                {(facture.paiements ?? []).map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{formatCurrency(Number(p.montant))}</p>
                      <p className="text-xs text-gray-400">{p.mode} · {formatDate(p.datePaiement)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment form modal */}
      {showPaiement && (
        <PaiementForm
          factureId={facture.id}
          resteAPayer={Number(facture.resteAPayer)}
          onClose={() => setShowPaiement(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURE(id!) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
            setShowPaiement(false);
            toast.success('Paiement enregistré');
          }}
        />
      )}
    </div>
  );
}
