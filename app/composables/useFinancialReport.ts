export type ReportPeriod = {
  fromISO: string | null
  toISO: string | null
  label: string
}

export type ReportRow = {
  vendor: string
  count: number
  total: number
  avg: number
  pct: number
}

export type LargeInvoice = {
  id: string
  vendor: string
  date: string
  currency: string
  total: number
  person: string
}

export type MonthlyBucket = {
  ymKey: string
  label: string
  total: number
  count: number
}

export type ItemRow = {
  description: string
  count: number
  total: number
}

export type FinancialReport = {
  period: ReportPeriod
  currency: string
  totals: {
    spend: number
    invoiceCount: number
    avg: number
    median: number
    min: number
    max: number
    tax: number
    vendors: number
    peopleAssigned: number
    voidedCount: number
    voidedAmount: number
  }
  topVendors: ReportRow[]
  bottomVendors: ReportRow[]
  topCategories: ReportRow[]
  topPeople: ReportRow[]
  byRole: ReportRow[]
  largestInvoices: LargeInvoice[]
  smallestInvoices: LargeInvoice[]
  monthly: MonthlyBucket[]
  topItems: ItemRow[]
  generatedAt: string
}

type InvoiceRow = {
  id: string
  vendor: string | null
  invoice_date: string | null
  created_at: string
  currency: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
  voided_at: string | null
  person_id: string | null
}

type PersonRow = { id: string; name: string; role: string }
type CollectionRow = { id: string; parent_id: string | null; name: string }
type LinkRow = { invoice_id: string; collection_id: string }
type ItemDbRow = { invoice_id: string; description: string; amount: number | null }

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : sorted[mid] ?? 0
}

function topN<T>(rows: T[], n: number, key: (r: T) => number): T[] {
  return [...rows].sort((a, b) => key(b) - key(a)).slice(0, n)
}

function pickDominantCurrency(rows: InvoiceRow[]): string {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const c = (r.currency || 'EUR').toUpperCase()
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  let best = 'EUR'
  let bestN = 0
  for (const [c, n] of counts) {
    if (n > bestN) {
      best = c
      bestN = n
    }
  }
  return best
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(ym: string): string {
  const [yStr, mStr] = ym.split('-')
  const y = Number(yStr)
  const m = Number(mStr)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1)
    .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    .toUpperCase()
}

export function useFinancialReport() {
  const supabase = useSupabaseClient()

  async function build(period: ReportPeriod): Promise<FinancialReport> {
    let invQ = supabase
      .from('invoices')
      .select('id, vendor, invoice_date, created_at, currency, subtotal, tax, total, voided_at, person_id')
      .order('created_at', { ascending: false })
    if (period.fromISO) invQ = invQ.gte('created_at', period.fromISO)
    if (period.toISO) invQ = invQ.lte('created_at', period.toISO)

    const { data: invData, error: invErr } = await invQ
    if (invErr) throw new Error(`Could not load invoices: ${invErr.message}`)
    const invoices = (invData ?? []) as InvoiceRow[]
    const liveInvoices = invoices.filter((i) => !i.voided_at)
    const ids = liveInvoices.map((i) => i.id)

    const [peopleRes, collRes, linksRes, itemsRes] = await Promise.all([
      supabase.from('people').select('id, name, role'),
      supabase.from('collections').select('id, parent_id, name'),
      ids.length
        ? supabase.from('invoice_collections').select('invoice_id, collection_id').in('invoice_id', ids)
        : Promise.resolve({ data: [] as LinkRow[], error: null }),
      ids.length
        ? supabase.from('invoice_items').select('invoice_id, description, amount').in('invoice_id', ids)
        : Promise.resolve({ data: [] as ItemDbRow[], error: null }),
    ])

    const people = (peopleRes.error ? [] : (peopleRes.data ?? [])) as PersonRow[]
    const collections = (collRes.error ? [] : (collRes.data ?? [])) as CollectionRow[]
    const links = (linksRes.error ? [] : (linksRes.data ?? [])) as LinkRow[]
    const items = (itemsRes.error ? [] : (itemsRes.data ?? [])) as ItemDbRow[]

    const peopleById = new Map<string, PersonRow>()
    for (const p of people) peopleById.set(p.id, p)
    const collById = new Map<string, CollectionRow>()
    for (const c of collections) collById.set(c.id, c)

    const rootCache = new Map<string, string | null>()
    function rootOf(id: string): string | null {
      const cached = rootCache.get(id)
      if (cached !== undefined) return cached
      let cur = collById.get(id)
      let safety = 0
      while (cur && cur.parent_id && safety < 50) {
        const next = collById.get(cur.parent_id)
        if (!next) break
        cur = next
        safety++
      }
      const rootId = cur?.id ?? null
      rootCache.set(id, rootId)
      return rootId
    }

    const totals = liveInvoices.map((i) => Number(i.total ?? 0))
    const spend = totals.reduce((acc, n) => acc + n, 0)
    const taxSum = liveInvoices.reduce((acc, i) => acc + Number(i.tax ?? 0), 0)
    const voided = invoices.filter((i) => !!i.voided_at)
    const voidedAmount = voided.reduce((acc, i) => acc + Number(i.total ?? 0), 0)

    const vendorAgg = new Map<string, { count: number; total: number }>()
    for (const i of liveInvoices) {
      const key = (i.vendor || 'Unknown vendor').trim() || 'Unknown vendor'
      const agg = vendorAgg.get(key) ?? { count: 0, total: 0 }
      agg.count++
      agg.total += Number(i.total ?? 0)
      vendorAgg.set(key, agg)
    }
    const vendorRows: ReportRow[] = [...vendorAgg.entries()].map(([vendor, v]) => ({
      vendor,
      count: v.count,
      total: v.total,
      avg: v.count > 0 ? v.total / v.count : 0,
      pct: spend > 0 ? (v.total / spend) * 100 : 0,
    }))

    const topVendors = topN(vendorRows, 10, (r) => r.total)
    const bottomVendors = [...vendorRows]
      .sort((a, b) => a.total - b.total)
      .slice(0, 10)
      .map((r) => r)

    const catAgg = new Map<string, { count: number; total: number; seen: Set<string> }>()
    for (const link of links) {
      const inv = liveInvoices.find((i) => i.id === link.invoice_id)
      if (!inv) continue
      const root = rootOf(link.collection_id)
      if (!root) continue
      const node = collById.get(root)
      const name = node?.name ?? 'Uncategorized'
      const agg = catAgg.get(name) ?? { count: 0, total: 0, seen: new Set<string>() }
      if (agg.seen.has(inv.id)) continue
      agg.seen.add(inv.id)
      agg.count++
      agg.total += Number(inv.total ?? 0)
      catAgg.set(name, agg)
    }
    const categorizedTotal = [...catAgg.values()].reduce((acc, a) => acc + a.total, 0)
    const topCategories: ReportRow[] = topN(
      [...catAgg.entries()].map(([name, a]) => ({
        vendor: name,
        count: a.count,
        total: a.total,
        avg: a.count > 0 ? a.total / a.count : 0,
        pct: categorizedTotal > 0 ? (a.total / categorizedTotal) * 100 : 0,
      })),
      10,
      (r) => r.total,
    )

    const personAgg = new Map<string, { count: number; total: number }>()
    let assignedCount = 0
    for (const i of liveInvoices) {
      if (!i.person_id) continue
      assignedCount++
      const agg = personAgg.get(i.person_id) ?? { count: 0, total: 0 }
      agg.count++
      agg.total += Number(i.total ?? 0)
      personAgg.set(i.person_id, agg)
    }
    const peopleAssignedTotal = [...personAgg.values()].reduce((acc, a) => acc + a.total, 0)
    const topPeople: ReportRow[] = topN(
      [...personAgg.entries()].map(([pid, a]) => ({
        vendor: peopleById.get(pid)?.name ?? 'Unknown',
        count: a.count,
        total: a.total,
        avg: a.count > 0 ? a.total / a.count : 0,
        pct: peopleAssignedTotal > 0 ? (a.total / peopleAssignedTotal) * 100 : 0,
      })),
      10,
      (r) => r.total,
    )

    const roleAgg = new Map<string, { count: number; total: number }>()
    for (const i of liveInvoices) {
      if (!i.person_id) continue
      const role = peopleById.get(i.person_id)?.role ?? 'Other'
      const agg = roleAgg.get(role) ?? { count: 0, total: 0 }
      agg.count++
      agg.total += Number(i.total ?? 0)
      roleAgg.set(role, agg)
    }
    const byRole: ReportRow[] = topN(
      [...roleAgg.entries()].map(([role, a]) => ({
        vendor: role,
        count: a.count,
        total: a.total,
        avg: a.count > 0 ? a.total / a.count : 0,
        pct: peopleAssignedTotal > 0 ? (a.total / peopleAssignedTotal) * 100 : 0,
      })),
      10,
      (r) => r.total,
    )

    function nameForPerson(pid: string | null): string {
      if (!pid) return '—'
      return peopleById.get(pid)?.name ?? '—'
    }
    const sortedByTotalDesc = [...liveInvoices].sort(
      (a, b) => Number(b.total ?? 0) - Number(a.total ?? 0),
    )
    const sortedByTotalAsc = [...liveInvoices]
      .filter((i) => Number(i.total ?? 0) > 0)
      .sort((a, b) => Number(a.total ?? 0) - Number(b.total ?? 0))

    function toLargeInvoice(i: InvoiceRow): LargeInvoice {
      return {
        id: i.id,
        vendor: i.vendor || 'Unknown vendor',
        date: (i.invoice_date || i.created_at || '').slice(0, 10),
        currency: (i.currency || 'EUR').toUpperCase(),
        total: Number(i.total ?? 0),
        person: nameForPerson(i.person_id),
      }
    }
    const largestInvoices = sortedByTotalDesc.slice(0, 10).map(toLargeInvoice)
    const smallestInvoices = sortedByTotalAsc.slice(0, 10).map(toLargeInvoice)

    const monthMap = new Map<string, { total: number; count: number }>()
    for (const i of liveInvoices) {
      const src = i.created_at
      if (!src) continue
      const d = new Date(src)
      if (Number.isNaN(d.getTime())) continue
      const key = monthKey(d)
      const agg = monthMap.get(key) ?? { total: 0, count: 0 }
      agg.total += Number(i.total ?? 0)
      agg.count++
      monthMap.set(key, agg)
    }
    const monthly: MonthlyBucket[] = [...monthMap.entries()]
      .sort((a, b) => (a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0))
      .map(([k, v]) => ({ ymKey: k, label: monthLabel(k), total: v.total, count: v.count }))

    const itemAgg = new Map<string, { count: number; total: number }>()
    for (const it of items) {
      const key = (it.description || '').trim().slice(0, 80) || '—'
      const norm = key.toLowerCase()
      const agg = itemAgg.get(norm) ?? { count: 0, total: 0 }
      agg.count++
      agg.total += Number(it.amount ?? 0)
      itemAgg.set(norm, agg)
    }
    const topItems: ItemRow[] = topN(
      [...itemAgg.entries()].map(([desc, a]) => ({
        description: desc,
        count: a.count,
        total: a.total,
      })),
      15,
      (r) => r.total,
    )

    const vendorsUnique = vendorAgg.size

    return {
      period,
      currency: pickDominantCurrency(liveInvoices),
      totals: {
        spend,
        invoiceCount: liveInvoices.length,
        avg: liveInvoices.length > 0 ? spend / liveInvoices.length : 0,
        median: median(totals),
        min: totals.length > 0 ? Math.min(...totals) : 0,
        max: totals.length > 0 ? Math.max(...totals) : 0,
        tax: taxSum,
        vendors: vendorsUnique,
        peopleAssigned: assignedCount,
        voidedCount: voided.length,
        voidedAmount,
      },
      topVendors,
      bottomVendors,
      topCategories,
      topPeople,
      byRole,
      largestInvoices,
      smallestInvoices,
      monthly,
      topItems,
      generatedAt: new Date().toISOString(),
    }
  }

  return { build }
}
