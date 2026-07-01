import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientsPage } from '../pages/clients/ClientsPage';
import { ClientDetailPage } from '../pages/clients/ClientDetailPage';
import { ProduitsPage } from '../pages/produits/ProduitsPage';
import { FacturesPage } from '../pages/factures/FacturesPage';
import { FactureCreatePage } from '../pages/factures/FactureCreatePage';
import { FactureDetailPage } from '../pages/factures/FactureDetailPage';
import { PaiementsPage } from '../pages/paiements/PaiementsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SecteursPage } from '../pages/SecteursPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import SuperAdminDashboardPage from '../pages/superadmin/SuperAdminDashboardPage';
import SocietesListPage from '../pages/superadmin/SocietesListPage';
import SocieteCreatePage from '../pages/superadmin/SocieteCreatePage';
import SocieteDetailPage from '../pages/superadmin/SocieteDetailPage';
import CompanySettingsPage from '../pages/settings/CompanySettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  // Routes SUPERADMIN
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute allowedRoles={['SUPERADMIN']}>
        <SuperAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SuperAdminDashboardPage /> },
      { path: 'societes', element: <SocietesListPage /> },
      { path: 'societes/nouvelle', element: <SocieteCreatePage /> },
      { path: 'societes/:id', element: <SocieteDetailPage /> },
    ],
  },
  // Routes company (tous les autres rôles)
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COMPTABLE', 'CAISSIER', 'LECTURE']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'produits', element: <ProduitsPage /> },
      { path: 'factures', element: <FacturesPage /> },
      { path: 'factures/nouvelle', element: <FactureCreatePage /> },
      { path: 'factures/:id', element: <FactureDetailPage /> },
      { path: 'paiements', element: <PaiementsPage /> },
      { path: 'utilisateurs', element: <UsersPage /> },
      { path: 'rapports', element: <ReportsPage /> },
      { path: 'secteurs', element: <SecteursPage /> },
      { path: 'parametres/societe', element: <CompanySettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
