export type Role = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'COMPTABLE' | 'CAISSIER' | 'LECTURE';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  avatar?: string;
  telephone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  societeId: string | null;
  societe?: {
    id: string;
    nom: string;
    logoUrl?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginPayload {
  email: string;
  motDePasse: string;
}
