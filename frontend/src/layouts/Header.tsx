import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.service';
import { QUERY_KEYS } from '../constants/query-keys';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [search, setSearch] = useState('');

  const { data: countData } = useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS_COUNT,
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data.data as { count: number };
    },
    refetchInterval: 30000,
  });

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between gap-4 px-4 sm:px-6 sticky top-0 z-40 shadow-xs">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        aria-label="Ouvrir le menu de navigation"
      >
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une facture, un client, un produit..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-input rounded-lg text-foreground placeholder:text-muted-foreground/70 outline-none focus:bg-card focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          <Bell size={18} />
          {(countData?.count ?? 0) > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {countData!.count > 9 ? '9+' : countData!.count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
