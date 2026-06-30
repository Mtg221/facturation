import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import {
  Users, FileText, CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { QUERY_KEYS } from '../constants/query-keys';
import { formatCurrency, formatPercent } from '../utils/format-currency';

const STATUS_COLORS: Record<string, string> = {
  PAYEE: '#22c55e',
  PARTIELLEMENT_PAYEE: '#f59e0b',
  ENVOYEE: '#3b82f6',
  BROUILLON: '#94a3b8',
  EN_RETARD: '#ef4444',
  ANNULEE: '#6b7280',
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${iconColor}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend >= 0 ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(trend)} vs mois dernier
          </span>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_KPIS,
    queryFn: dashboardService.getKpis,
  });

  const { data: revenueData } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_REVENUE(new Date().getFullYear()),
    queryFn: () => dashboardService.getRevenueChart(new Date().getFullYear()),
  });

  const { data: statusData } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATUS,
    queryFn: dashboardService.getPaymentStatus,
  });

  const { data: topClients } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_TOP_CLIENTS,
    queryFn: () => dashboardService.getTopClients(8),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Total clients"
          value={String(kpis?.totalClients ?? '—')}
          sub={`+${kpis?.newClientsThisMonth ?? 0} ce mois`}
          iconColor="bg-blue-500"
        />
        <KpiCard
          icon={FileText}
          label="Total factures"
          value={String(kpis?.totalFactures ?? '—')}
          sub={`${kpis?.facturesPayees ?? 0} payées`}
          iconColor="bg-indigo-500"
        />
        <KpiCard
          icon={DollarSign}
          label="Revenus du mois"
          value={formatCurrency(kpis?.revenueMois ?? 0)}
          trend={kpis?.croissanceRevenu}
          iconColor="bg-green-500"
        />
        <KpiCard
          icon={AlertCircle}
          label="Impayés"
          value={formatCurrency(kpis?.montantImpaye ?? 0)}
          sub={`${kpis?.facturesEnRetard ?? 0} en retard`}
          iconColor="bg-red-500"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Évolution des revenus {new Date().getFullYear()}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData ?? []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Revenus']}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1e3a5f"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Statut des factures</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData ?? []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="statut"
              >
                {(statusData ?? []).map((entry: { statut: string }) => (
                  <Cell key={entry.statut} fill={STATUS_COLORS[entry.statut] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {(statusData ?? []).map((s: { statut: string; count: number }) => (
              <div key={s.statut} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: STATUS_COLORS[s.statut] ?? '#94a3b8' }}
                  />
                  <span className="text-gray-600">{s.statut.replace('_', ' ')}</span>
                </div>
                <span className="font-medium text-gray-800">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Top clients par chiffre d'affaires
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={topClients ?? []}
            layout="vertical"
            margin={{ left: 0, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={160} />
            <Tooltip formatter={(v: number) => [formatCurrency(v), 'CA encaissé']} />
            <Bar dataKey="totalPaye" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
