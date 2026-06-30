import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
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

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
