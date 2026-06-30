export function formatCurrency(amount: number, currency = 'FCFA'): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount) + ' ' + currency;
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}
