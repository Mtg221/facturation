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
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#1e3a5f] text-white flex flex-col transition-transform lg:transition-all duration-300 z-50',
        // Width: mobile drawer is always full width; collapse only applies on desktop
        collapsed ? 'w-64 lg:w-16' : 'w-64',
        // Off-canvas on mobile, always visible on desktop
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className={cn(collapsed && 'lg:hidden')}>
          <div className="font-bold text-lg tracking-wide truncate">
            {user?.societe?.nom ?? 'Facturation'}
          </div>
          <div className="text-xs text-white/60">Plateforme de gestion</div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
        >
          <ChevronLeft
            size={16}
            className={cn('transition-transform', collapsed ? 'rotate-180' : '')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'ADMIN') return null;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                  collapsed && 'lg:justify-center',
                )
              }
              onClick={onMobileClose}
            >
              <item.icon size={18} className="shrink-0" />
              <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10">
        <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center')}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </span>
          </div>
          <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
            <div className="text-sm font-medium truncate">
              {user?.prenom} {user?.nom}
            </div>
            <div className="text-xs text-white/60 truncate">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className={cn(
              'p-1.5 rounded-lg hover:bg-white/10 transition-colors',
              collapsed && 'lg:hidden',
            )}
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
