// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

type Row = Record<string, unknown>

function makeQuery(data: Row[]) {
  const q: Record<string, unknown> = {}
  const result = Promise.resolve({ data, error: null })
  const passthrough = () => q
  q.select = passthrough
  q.order = passthrough
  q.gte = passthrough
  q.lte = passthrough
  q.in = passthrough
  q.then = result.then.bind(result)
  return q
}

const fixtures = {
  invoices: [
    { id: 'i1', vendor: 'Vendor A', invoice_date: '2025-01-05', created_at: '2025-01-05T10:00:00Z', currency: 'USD', subtotal: 90, tax: 10, total: 100, voided_at: null, person_id: 'p1' },
    { id: 'i2', vendor: 'Vendor A', invoice_date: '2025-01-15', created_at: '2025-01-15T10:00:00Z', currency: 'USD', subtotal: 180, tax: 20, total: 200, voided_at: null, person_id: 'p1' },
    { id: 'i3', vendor: 'Vendor B', invoice_date: '2025-02-01', created_at: '2025-02-01T10:00:00Z', currency: 'USD', subtotal: 45, tax: 5, total: 50, voided_at: null, person_id: 'p2' },
    { id: 'i4', vendor: 'Vendor C', invoice_date: '2025-02-10', created_at: '2025-02-10T10:00:00Z', currency: 'USD', subtotal: null, tax: null, total: 25, voided_at: '2025-02-11T00:00:00Z', person_id: null },
  ],
  people: [
    { id: 'p1', name: 'Persona Uno', role: 'family' },
    { id: 'p2', name: 'Persona Dos', role: 'work' },
  ],
  collections: [
    { id: 'c-root', parent_id: null, name: 'Casa' },
    { id: 'c-child', parent_id: 'c-root', name: 'Luz' },
  ],
  invoice_collections: [
    { invoice_id: 'i1', collection_id: 'c-child' },
    { invoice_id: 'i2', collection_id: 'c-root' },
  ],
  invoice_items: [
    { invoice_id: 'i1', description: 'Widget', amount: 50 },
    { invoice_id: 'i1', description: 'Widget', amount: 40 },
    { invoice_id: 'i2', description: 'Gadget', amount: 200 },
    { invoice_id: 'i3', description: 'Service', amount: 50 },
  ],
}

mockNuxtImport('useSupabaseClient', () => {
  return () => ({
    from: (table: keyof typeof fixtures) => makeQuery(fixtures[table] ?? []),
  })
})

import { useFinancialReport } from '../../app/composables/useFinancialReport'

describe('useFinancialReport.build', () => {
  it('aggregates spend only over non-voided invoices', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    expect(r.totals.spend).toBe(350)
    expect(r.totals.invoiceCount).toBe(3)
    expect(r.totals.voidedCount).toBe(1)
    expect(r.totals.voidedAmount).toBe(25)
  })

  it('computes median, min, max, tax and unique vendor count correctly', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    expect(r.totals.median).toBe(100)
    expect(r.totals.min).toBe(50)
    expect(r.totals.max).toBe(200)
    expect(r.totals.tax).toBe(35)
    expect(r.totals.vendors).toBe(2)
  })

  it('ranks top vendors by total spend', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    expect(r.topVendors[0]?.vendor).toBe('Vendor A')
    expect(r.topVendors[0]?.total).toBe(300)
    expect(r.topVendors[0]?.count).toBe(2)
    expect(r.topVendors[0]?.pct).toBeCloseTo((300 / 350) * 100, 5)
  })

  it('rolls child collections up to their root for category aggregation', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    const casa = r.topCategories.find((c) => c.vendor === 'Casa')
    expect(casa).toBeDefined()
    expect(casa?.count).toBe(2)
    expect(casa?.total).toBe(300)
  })

  it('attributes person totals using people table and tracks assigned count', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    expect(r.totals.peopleAssigned).toBe(3)
    const uno = r.topPeople.find((p) => p.vendor === 'Persona Uno')
    expect(uno?.total).toBe(300)
    expect(uno?.count).toBe(2)
  })

  it('lists largest invoices in descending order with normalized fields', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    expect(r.largestInvoices[0]?.id).toBe('i2')
    expect(r.largestInvoices[0]?.total).toBe(200)
    expect(r.largestInvoices[0]?.person).toBe('Persona Uno')
    expect(r.largestInvoices[0]?.currency).toBe('USD')
    expect(r.largestInvoices[0]?.date).toBe('2025-01-15')
  })

  it('buckets months chronologically using created_at', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    expect(r.monthly.map((m) => m.ymKey)).toEqual(['2025-01', '2025-02'])
    expect(r.monthly[0]?.total).toBe(300)
    expect(r.monthly[1]?.total).toBe(50)
  })

  it('merges duplicate item descriptions case-insensitively for topItems', async () => {
    const { build } = useFinancialReport()
    const r = await build({ fromISO: null, toISO: null, label: 'all' })
    const widget = r.topItems.find((i) => i.description === 'widget')
    expect(widget?.count).toBe(2)
    expect(widget?.total).toBe(90)
  })
})
