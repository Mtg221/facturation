export interface RequestUser {
  id: string;
  email: string;
  role: string;
  nom: string;
  prenom: string;
  societeId: string | null;
}
