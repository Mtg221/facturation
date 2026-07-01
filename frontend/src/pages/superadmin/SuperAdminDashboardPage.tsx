import { useQuery } from '@tanstack/react-query';
import { Building2, Users, FileText, TrendingUp } from 'lucide-react';
import societesService from '../../services/societes.service';
import { formatCurrency } from '../../utils/format-currency';

export default function SuperAdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: societesService.getPlatformStats,
  });

  const cards = [
    { label: 'Sociétés actives', value: stats?.societes ?? 0, icon: Building2, color: 'bg-blue-500' },
    { label: 'Utilisateurs', value: stats?.users ?? 0, icon: Users, color: 'bg-green-500' },
    { label: 'Factures totales', value: stats?.factures ?? 0, icon: FileText, color: 'bg-purple-500' },
    {
      label: "Chiffre d'affaires total",
      value: formatCurrency(Number(stats?.chiffreAffairesTotal ?? 0)),
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard plateforme</h1>
        <p className="text-gray-500 mt-1">Vue globale de toutes les sociétés</p>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-gray-500">{card.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
