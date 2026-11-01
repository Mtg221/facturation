import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  Users, FileText, AlertCircle, DollarSign, Plus, ArrowRight,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { QUERY_KEYS } from '../constants/query-keys';
import { formatCurrency } from '../utils/format-currency';
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from '../components/ui';

const STATUS_COLORS: Record<string, string> = {
  PAYEE: '#10b981',             // emerald-500
  PARTIELLEMENT_PAYEE: '#f59e0b',// amber-500
  ENVOYEE: '#3b82f6',            // blue-500
  BROUILLON: '#94a3b8',          // slate-400
  EN_RETARD: '#dc2626',          // rose-600
  ANNULEE: '#64748b',            // slate-500
};

export function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const { data: kpis } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_KPIS,
    queryFn: dashboardService.getKpis,
  });

  const { data: revenueData } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_REVENUE(currentYear),
    queryFn: () => dashboardService.getRevenueChart(currentYear),
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
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisez vos indicateurs clés de performance et votre trésorerie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/factures/nouvelle">
            <Button variant="default" className="shadow-xs">
              <Plus size={16} />
              <span>Créer une facture</span>
            </Button>
          </Link>
          <Link to="/factures">
            <Button variant="outline" size="md">
              <span>Voir les factures</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total clients"
          value={String(kpis?.totalClients ?? '0')}
          sub={`+${kpis?.newClientsThisMonth ?? 0} nouveau(x) ce mois`}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={FileText}
          label="Total factures"
          value={String(kpis?.totalFactures ?? '0')}
          sub={`${kpis?.facturesPayees ?? 0} payée(s)`}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={DollarSign}
          label="Revenus du mois"
          value={formatCurrency(kpis?.revenueMois ?? 0)}
          trend={kpis?.croissanceRevenu}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          icon={AlertCircle}
          label="Montant impayé"
          value={formatCurrency(kpis?.montantImpaye ?? 0)}
          sub={`${kpis?.facturesEnRetard ?? 0} en retard de paiement`}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Évolution des revenus</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Exercice {currentYear} en FCFA</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              Mensuel
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenus encaissés']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1e3a5f"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Répartition par statut</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Volume des factures émises</p>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="statut"
                  >
                    {(statusData ?? []).map((entry: { statut: string }) => (
                      <Cell key={entry.statut} fill={STATUS_COLORS[entry.statut] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `${v} facture(s)`,
                      name.replace('_', ' '),
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
              {(statusData ?? []).map((s: { statut: string; count: number }) => (
                <div key={s.statut} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: STATUS_COLORS[s.statut] ?? '#94a3b8' }}
                    />
                    <span className="text-muted-foreground capitalize">
                      {s.statut.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Top clients par chiffre d'affaires</CardTitle>
          <p className="text-xs text-muted-foreground">Classement des clients par volume total réglé</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClients ?? []}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 500 }}
                  width={150}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Total encaissé']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="totalPaye"
                  fill="#1e3a5f"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
