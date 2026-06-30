export interface Secteur {
  id: string;
  nom: string;
  description?: string;
}

export interface Client {
  id: string;
  code: string;
  nom: string;
  email?: string;
  telephone1?: string;
  telephone2?: string;
  telephone3?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  localisation?: string;
  ninea?: string;
  rc?: string;
  commentaire?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  secteurs: Array<{ secteur: Secteur }>;
  _count?: { factures: number };
}

export interface CreateClientPayload {
  nom: string;
  email?: string;
  telephone1?: string;
  telephone2?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  ninea?: string;
  commentaire?: string;
  secteurIds?: string[];
}
