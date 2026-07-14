export type StatutFacture =
  | 'BROUILLON'
  | 'ENVOYEE'
  | 'PARTIELLEMENT_PAYEE'
  | 'PAYEE'
  | 'ANNULEE'
  | 'EN_RETARD';

export interface DetailFacture {
  id: string;
  produitId?: string;
  designation: string;
  observation?: string;
  quantite: number;
  prixUnitaire: number;
  tva: number;
  remise: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  ordre: number;
}

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  userId: string;
  statut: StatutFacture;
  dateEmission: string;
  dateEcheance: string;
  notes?: string;
  conditionsPaiement?: string;
  remiseGlobale: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  resteAPayer: number;
  montantEnLettres?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; nom: string; code: string };
  user?: { id: string; nom: string; prenom: string };
  details?: DetailFacture[];
  paiements?: Paiement[];
}

export interface Paiement {
  id: string;
  factureId: string;
  userId: string;
  montant: number;
  mode: 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'CARTE' | 'MOBILE_MONEY';
  reference?: string;
  numeroCheque?: string;
  banque?: string;
  commentaire?: string;
  recuPar?: string;
  payePar?: string;
  datePaiement: string;
  createdAt: string;
}

export interface CreateFacturePayload {
  clientId: string;
  dateEcheance: string;
  dateEmission?: string;
  remiseGlobale?: number;
  notes?: string;
  conditionsPaiement?: string;
  details: Array<{
    produitId?: string;
    designation: string;
    observation?: string;
    quantite: number;
    prixUnitaire: number;
    tva?: number;
    remise?: number;
    ordre?: number;
  }>;
}
