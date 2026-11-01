import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Eye, Download, Copy, Trash2, Pencil,
  FileText, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { facturesService } from '../../services/factures.service';
import { QUERY_KEYS } from '../../constants/query-keys';
import { formatDate } from '../../utils/format-date';
import { formatCurrency } from '../../utils/format-currency';
import type { Facture, StatutFacture } from '../../types/facture.types';
import {
  Button,
  Badge,
  Input,
  Select,
  Card,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui';
import type { BadgeProps } from '../../components/ui';

const STATUT_BADGE_MAP: Record<StatutFacture, { variant: BadgeProps['variant']; label: string }> = {
  BROUILLON: { variant: 'default', label: 'Brouillon' },
  ENVOYEE: { variant: 'info', label: 'Envoyée' },
  PARTIELLEMENT_PAYEE: { variant: 'warning', label: 'Part. payée' },
  PAYEE: { variant: 'success', label: 'Payée' },
  ANNULEE: { variant: 'outline', label: 'Annulée' },
  EN_RETARD: { variant: 'destructive', label: 'En retard' },
};

const FILTER_TABS = [
  { value: '', label: 'Toutes' },
  { value: 'EN_RETARD', label: 'En retard' },
  { value: 'ENVOYEE', label: 'Envoyées' },
  { value: 'PARTIELLEMENT_PAYEE', label: 'Part. payées' },
  { value: 'PAYEE', label: 'Payées' },
  { value: 'BROUILLON', label: 'Brouillons' },
];

export function FacturesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.FACTURES, { search, statut, page }],
    queryFn: () => facturesService.findAll({ search, statut: statut || undefined, page, limit: 20 }),
  });

  const duplicateMutation = useMutation({
    mutationFn: facturesService.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      toast.success('Facture dupliquée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la duplication de la facture');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: facturesService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FACTURES });
      toast.success('Facture supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const factures = data?.data ?? [];
  const meta = data?.meta;

  const handleResetFilters = () => {
    setSearch('');
    setStatut('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Factures
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez, suivez et exportez l'ensemble de vos factures clients
          </p>
        </div>
        <Link to="/factures/nouvelle">
          <Button variant="default" className="w-full sm:w-auto shadow-sm">
            <Plus size={16} />
            <span>Nouvelle facture</span>
          </Button>
        </Link>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = statut === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatut(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filter Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par numéro, nom client..."
              icon={<Search size={16} />}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                title="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <Select
              value={statut}
              onChange={(e) => {
                setStatut(e.target.value);
                setPage(1);
              }}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_BADGE_MAP).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          {(search || statut) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs shrink-0 self-end sm:self-center"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Data Table Container */}
      <Card className="overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-28">Émission</TableHead>
                <TableHead className="w-28">Échéance</TableHead>
                <TableHead className="text-right w-36">Montant TTC</TableHead>
                <TableHead className="text-right w-36">Reste à payer</TableHead>
                <TableHead className="w-32">Statut</TableHead>
                <TableHead className="text-right w-36 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : factures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12">
                    <EmptyState
                      icon={FileText}
                      title={search || statut ? 'Aucun résultat trouvé' : 'Aucune facture enregistrée'}
                      description={
                        search || statut
                          ? 'Essayez de modifier vos critères de recherche ou de réinitialiser vos filtres.'
                          : 'Créez votre première facture professionnelle pour démarrer votre suivi financier.'
                      }
                      actionLabel={search || statut ? 'Réinitialiser les filtres' : 'Créer une facture'}
                      onAction={search || statut ? handleResetFilters : () => window.location.assign('/factures/nouvelle')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                factures.map((f: Facture) => {
                  const statusInfo = STATUT_BADGE_MAP[f.statut] || { variant: 'default', label: f.statut };
                  const reste = Number(f.resteAPayer);

                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        <Link
                          to={`/factures/${f.id}`}
                          className="hover:text-secondary hover:underline underline-offset-2 transition-colors"
                        >
                          {f.numero}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {f.client?.nom ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(f.dateEmission)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(f.dateEcheance)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(Number(f.montantTTC))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold text-xs ${
                            reste > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {formatCurrency(reste)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} dot>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/factures/${f.id}`}
                            title="Consulter"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye size={15} />
                          </Link>
                          {f.statut === 'BROUILLON' && (
                            <Link
                              to={`/factures/${f.id}/modifier`}
                              title="Modifier"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                            >
                              <Pencil size={15} />
                            </Link>
                          )}
                          <button
                            onClick={() => facturesService.getPdf(f.id, f.numero)}
                            title="Télécharger PDF"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={() => duplicateMutation.mutate(f.id)}
                            title="Dupliquer"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
                          >
                            <Copy size={15} />
                          </button>
                          {f.statut === 'BROUILLON' && (
                            <button
                              onClick={() => {
                                if (window.confirm('Voulez-vous supprimer définitivement cette facture ?')) {
                                  deleteMutation.mutate(f.id);
                                }
                              }}
                              title="Supprimer"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-border/60">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : factures.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title={search || statut ? 'Aucun résultat' : 'Aucune facture'}
                description="Modifiez vos filtres ou créez une nouvelle facture."
                actionLabel={search || statut ? 'Réinitialiser' : 'Créer une facture'}
                onAction={search || statut ? handleResetFilters : () => window.location.assign('/factures/nouvelle')}
              />
            </div>
          ) : (
            factures.map((f: Facture) => {
              const statusInfo = STATUT_BADGE_MAP[f.statut] || { variant: 'default', label: f.statut };
              const reste = Number(f.resteAPayer);

              return (
                <div key={f.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {f.numero}
                      </span>
                      <p className="font-medium text-sm text-foreground truncate mt-0.5">
                        {f.client?.nom ?? '—'}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant} dot>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/50">
                    <div>
                      <span className="text-muted-foreground">Échéance:</span>{' '}
                      <span className="text-foreground font-medium">{formatDate(f.dateEcheance)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">TTC:</span>{' '}
                      <span className="text-foreground font-bold">{formatCurrency(Number(f.montantTTC))}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-muted-foreground text-xs">Reste à payer: </span>
                      <span
                        className={`font-semibold ${
                          reste > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(reste)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Link
                      to={`/factures/${f.id}`}
                      className="px-2.5 py-1 text-xs rounded border border-border text-foreground hover:bg-muted font-medium inline-flex items-center gap-1"
                    >
                      <Eye size={13} /> Voir
                    </Link>
                    <button
                      onClick={() => facturesService.getPdf(f.id, f.numero)}
                      className="px-2.5 py-1 text-xs rounded border border-border text-foreground hover:bg-muted font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={13} /> PDF
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(f.id)}
                      className="px-2.5 py-1 text-xs rounded border border-border text-foreground hover:bg-muted font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={13} /> Dupliquer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} sur <span className="font-semibold text-foreground">{meta.total}</span> factures
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Précédent</span>
              </Button>
              <span className="text-xs text-muted-foreground font-medium px-2">
                Page {page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
