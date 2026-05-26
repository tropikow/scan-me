const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
}

export function currencySymbol(currency: string | null | undefined): string {
  if (!currency) return ''
  return CURRENCY_SYMBOL[currency.toUpperCase()] ?? currency
}

export function formatAmount(n: number | null, currency: string | null | undefined): string {
  if (n == null) return '—'
  const sym = currencySymbol(currency)
  return `${sym} ${n.toFixed(2)}`.trim()
}

export function formatShortDate(iso: string | null | undefined, fallback?: string | null): string {
  const src = iso || fallback || ''
  if (!src) return '—'
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return '—'
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    .toUpperCase()
}

export function formatLongDate(iso: string | null | undefined, fallback?: string | null): string {
  const src = iso || fallback || ''
  if (!src) return '—'
  const d = new Date(src)
  if (Number.isNaN(d.getTime())) return '—'
  return d
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}
