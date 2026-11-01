import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, Package, FileText,
  CreditCard, BarChart3, Settings, Building2, LogOut,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/auth.context';
import { ROUTES } from '../constants/routes';

const navItems = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: ROUTES.CLIENTS, icon: UserCheck, label: 'Clients' },
  { to: ROUTES.PRODUITS, icon: Package, label: 'Produits & Services' },
  { to: ROUTES.FACTURES, icon: FileText, label: 'Factures' },
  { to: ROUTES.PAIEMENTS, icon: CreditCard, label: 'Paiements' },
  { to: ROUTES.REPORTS, icon: BarChart3, label: 'Rapports' },
  { to: ROUTES.SECTEURS, icon: Building2, label: 'Secteurs' },
  { to: ROUTES.USERS, icon: Users, label: 'Utilisateurs', adminOnly: true },
  { to: ROUTES.COMPANY_SETTINGS, icon: Settings, label: 'Ma société', adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      aria-label="Navigation principale"
      className={cn(
        'fixed left-0 top-0 h-screen bg-primary text-primary-foreground flex flex-col transition-transform lg:transition-all duration-300 z-50 shadow-xl lg:shadow-none',
        // Width: mobile drawer is always full width; collapse only applies on desktop
        collapsed ? 'w-64 lg:w-16' : 'w-64',
        // Off-canvas on mobile, always visible on desktop
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-foreground/10 h-16">
        <div className={cn('transition-opacity duration-200', collapsed && 'lg:hidden')}>
          <div className="font-bold text-lg tracking-wide truncate">
            {user?.societe?.nom ?? 'Facturation'}
          </div>
          <div className="text-xs text-primary-foreground/70">Plateforme SaaS</div>
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Agrandir le menu latéral' : 'Réduire le menu latéral'}
          className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors ml-auto text-primary-foreground/80 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40 cursor-pointer"
        >
          <ChevronLeft
            size={18}
            className={cn('transition-transform duration-200', collapsed ? 'rotate-180' : '')}
          />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40',
                  isActive
                    ? 'bg-primary-foreground/15 text-primary-foreground font-semibold shadow-sm'
                    : 'text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                  collapsed && 'lg:justify-center lg:px-2',
                )
              }
            >
              <item.icon size={19} className="shrink-0" />
              <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-primary-foreground/10 space-y-2">
        <div className={cn('flex items-center gap-3 px-2 py-1', collapsed && 'lg:hidden')}>
          <div className="w-8 h-8 rounded-full bg-primary-foreground/15 text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-primary-foreground/20">
            {user?.nom?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-primary-foreground">
              {user?.nom} {user?.prenom}
            </div>
            <div className="text-xs text-primary-foreground/60 capitalize truncate">
              {user?.role?.toLowerCase()}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          aria-label="Se déconnecter"
          title={collapsed ? 'Se déconnecter' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-primary-foreground/75 hover:text-primary-foreground hover:bg-destructive/20 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
            collapsed && 'lg:justify-center lg:px-2',
          )}
        >
          <LogOut size={17} className="shrink-0" />
          <span className={cn(collapsed && 'lg:hidden')}>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
