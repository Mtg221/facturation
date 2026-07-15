import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut, ChevronLeft, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/auth.context';
import { ROUTES } from '../constants/routes';

const navItems = [
  { to: ROUTES.SUPERADMIN, icon: LayoutDashboard, label: 'Dashboard plateforme', end: true },
  { to: ROUTES.SUPERADMIN_SOCIETES, icon: Building2, label: 'Sociétés' },
];

export function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-[#0f2744] text-white flex flex-col transition-transform lg:transition-all duration-300 z-50',
          collapsed ? 'w-64 lg:w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className={cn(collapsed && 'lg:hidden')}>
            <div className="font-bold text-lg tracking-wide">Super Admin</div>
            <div className="text-xs text-white/60">Gestion plateforme</div>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto hidden lg:block"
          >
            <ChevronLeft size={16} className={cn('transition-transform', collapsed ? 'rotate-180' : '')} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10',
                  collapsed && 'lg:justify-center',
                )
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center')}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
            </div>
            <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
              <div className="text-sm font-medium truncate">{user?.prenom} {user?.nom}</div>
              <div className="text-xs text-white/60">SUPERADMIN</div>
            </div>
            <button
              onClick={logout}
              className={cn('p-1.5 rounded-lg hover:bg-white/10 transition-colors', collapsed && 'lg:hidden')}
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        {/* Mobile top bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sticky top-0 z-30 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-[#0f2744]">Super Admin</span>
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
