import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import type {
  FinancialReport,
  LargeInvoice,
  MonthlyBucket,
  ReportRow,
} from './useFinancialReport'

const INK: [number, number, number] = [29, 29, 31]
const GRAPHITE: [number, number, number] = [112, 112, 112]
const SLATE: [number, number, number] = [71, 71, 71]
const FOG: [number, number, number] = [245, 245, 247]
const MIST: [number, number, number] = [232, 232, 237]
const ACTION: [number, number, number] = [0, 113, 227]
const SUCCESS: [number, number, number] = [31, 122, 63]
const SNOW: [number, number, number] = [255, 255, 255]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 14
const MARGIN_TOP = 16
const MARGIN_BOTTOM = 18
const CONTENT_W = PAGE_W - MARGIN_X * 2

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
}

function symbolFor(currency: string): string {
  return CURRENCY_SYMBOL[currency.toUpperCase()] ?? currency.toUpperCase()
}

function fmtMoney(n: number, currency: string, opts?: { compact?: boolean; decimals?: number }): string {
  const sym = symbolFor(currency)
  const decimals = opts?.decimals ?? 2
  if (opts?.compact && Math.abs(n) >= 1000) {
    const units = ['', 'K', 'M', 'B']
    let v = n
    let i = 0
    while (Math.abs(v) >= 1000 && i < units.length - 1) {
      v /= 1000
      i++
    }
    const fixed = Math.abs(v) >= 100 ? 0 : 1
    return `${sym} ${v.toFixed(fixed)}${units[i]}`
  }
  return `${sym} ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function fmtInt(n: number): string {
  return n.toLocaleString('en-US')
}

function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function periodSummary(r: FinancialReport): string {
  const { fromISO, toISO } = r.period
  if (!fromISO && !toISO) return 'All time'
  const from = fromISO ? fmtDate(fromISO) : 'Earliest'
  const to = toISO ? fmtDate(toISO) : 'Today'
  return `${from} → ${to}`
}

type Cursor = { y: number }

function ensureSpace(doc: jsPDF, cur: Cursor, needed: number) {
  if (cur.y + needed > PAGE_H - MARGIN_BOTTOM) {
    doc.addPage()
    cur.y = MARGIN_TOP
  }
}

function setColor(doc: jsPDF, kind: 'text' | 'fill' | 'draw', c: [number, number, number]) {
  if (kind === 'text') doc.setTextColor(c[0], c[1], c[2])
  else if (kind === 'fill') doc.setFillColor(c[0], c[1], c[2])
  else doc.setDrawColor(c[0], c[1], c[2])
}

function drawSectionTitle(doc: jsPDF, cur: Cursor, title: string, eyebrow?: string) {
  ensureSpace(doc, cur, 16)
  if (eyebrow) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, 'text', GRAPHITE)
    doc.text(eyebrow.toUpperCase(), MARGIN_X, cur.y)
    cur.y += 4
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  setColor(doc, 'text', INK)
  doc.text(title, MARGIN_X, cur.y)
  cur.y += 3
  setColor(doc, 'draw', MIST)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_X, cur.y, PAGE_W - MARGIN_X, cur.y)
  cur.y += 6
}

function drawCoverHeader(doc: jsPDF, cur: Cursor, report: FinancialReport) {
  setColor(doc, 'fill', INK)
  doc.rect(0, 0, PAGE_W, 64, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setColor(doc, 'text', SNOW)
  doc.text('SCAN-ME · FINANCIAL REPORT', MARGIN_X, 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(report.period.label, MARGIN_X, 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setColor(doc, 'text', [200, 200, 205])
  doc.text(periodSummary(report), MARGIN_X, 38)

  const right = PAGE_W - MARGIN_X
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Generated ${fmtDate(report.generatedAt)}`, right, 14, { align: 'right' })
  doc.text(`Currency basis: ${symbolFor(report.currency)} ${report.currency}`, right, 19, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setColor(doc, 'text', [200, 200, 205])
  doc.text('TOTAL SPEND IN PERIOD', MARGIN_X, 50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setColor(doc, 'text', SNOW)
  doc.text(fmtMoney(report.totals.spend, report.currency, { decimals: 2 }), MARGIN_X, 60)

  cur.y = 76
}

function drawKpiGrid(doc: jsPDF, cur: Cursor, report: FinancialReport) {
  const cells: Array<{ lbl: string; v: string; sub?: string }> = [
    {
      lbl: 'INVOICES',
      v: fmtInt(report.totals.invoiceCount),
      sub: report.totals.voidedCount > 0 ? `${report.totals.voidedCount} voided` : 'No voided',
    },
    {
      lbl: 'AVG / INVOICE',
      v: fmtMoney(report.totals.avg, report.currency, { decimals: 2 }),
      sub: `Median ${fmtMoney(report.totals.median, report.currency, { decimals: 0 })}`,
    },
    {
      lbl: 'TAX PAID',
      v: fmtMoney(report.totals.tax, report.currency, { decimals: 2 }),
      sub:
        report.totals.spend > 0
          ? `${fmtPct((report.totals.tax / report.totals.spend) * 100)} of total`
          : '—',
    },
    {
      lbl: 'LARGEST INVOICE',
      v: fmtMoney(report.totals.max, report.currency, { decimals: 2 }),
      sub: `Min ${fmtMoney(report.totals.min, report.currency, { decimals: 2 })}`,
    },
    {
      lbl: 'UNIQUE VENDORS',
      v: fmtInt(report.totals.vendors),
      sub: 'distinct merchants',
    },
    {
      lbl: 'ASSIGNED TO PEOPLE',
      v: fmtInt(report.totals.peopleAssigned),
      sub:
        report.totals.invoiceCount > 0
          ? `${fmtPct((report.totals.peopleAssigned / report.totals.invoiceCount) * 100)} coverage`
          : '—',
    },
  ]

  const cols = 3
  const gap = 4
  const cellW = (CONTENT_W - gap * (cols - 1)) / cols
  const cellH = 26
  let x = MARGIN_X
  let y = cur.y

  cells.forEach((c, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    x = MARGIN_X + col * (cellW + gap)
    y = cur.y + row * (cellH + gap)

    setColor(doc, 'fill', FOG)
    doc.roundedRect(x, y, cellW, cellH, 2, 2, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setColor(doc, 'text', GRAPHITE)
    doc.text(c.lbl, x + 4, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setColor(doc, 'text', INK)
    doc.text(c.v, x + 4, y + 15)

    if (c.sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      setColor(doc, 'text', SLATE)
      doc.text(c.sub, x + 4, y + 22)
    }
  })

  const rows = Math.ceil(cells.length / cols)
  cur.y += rows * cellH + (rows - 1) * gap + 8
}

function drawBarChart(
  doc: jsPDF,
  cur: Cursor,
  labels: string[],
  values: number[],
  currency: string,
  opts?: { height?: number; color?: [number, number, number] },
) {
  const h = opts?.height ?? 60
  const color = opts?.color ?? INK
  ensureSpace(doc, cur, h + 14)

  const chartX = MARGIN_X
  const chartY = cur.y
  const chartW = CONTENT_W
  const chartH = h

  const max = Math.max(1, ...values)
  const n = values.length

  setColor(doc, 'draw', MIST)
  doc.setLineWidth(0.2)
  doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setColor(doc, 'text', GRAPHITE)
  doc.text(fmtMoney(max, currency, { compact: true, decimals: 0 }), chartX, chartY + 3)
  doc.text(fmtMoney(0, currency, { compact: true, decimals: 0 }), chartX, chartY + chartH - 1)

  const labelArea = 10
  const innerLeft = chartX + 14
  const innerW = chartW - 14
  const innerBottom = chartY + chartH - labelArea
  const innerH = chartH - labelArea

  if (n === 0) {
    doc.setFontSize(8)
    setColor(doc, 'text', GRAPHITE)
    doc.text('No data in period', chartX + chartW / 2, chartY + chartH / 2, { align: 'center' })
    cur.y += h + 6
    return
  }

  const gap = Math.min(2, innerW / (n * 6))
  const barW = (innerW - gap * (n - 1)) / n

  setColor(doc, 'fill', color)
  values.forEach((v, i) => {
    const hpx = (v / max) * innerH
    const x = innerLeft + i * (barW + gap)
    const y = innerBottom - hpx
    if (hpx > 0.3) {
      doc.rect(x, y, barW, hpx, 'F')
    } else {
      setColor(doc, 'fill', MIST)
      doc.rect(x, innerBottom - 0.5, barW, 0.5, 'F')
      setColor(doc, 'fill', color)
    }
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  setColor(doc, 'text', GRAPHITE)
  const step = n > 12 ? Math.ceil(n / 12) : 1
  labels.forEach((lbl, i) => {
    if (i % step !== 0 && i !== n - 1) return
    const x = innerLeft + i * (barW + gap) + barW / 2
    doc.text(lbl, x, chartY + chartH - 1.5, { align: 'center' })
  })

  cur.y += h + 6
}

function drawHorizontalBars(
  doc: jsPDF,
  cur: Cursor,
  rows: Array<{ label: string; value: number }>,
  currency: string,
  opts?: { rowHeight?: number; color?: [number, number, number]; max?: number },
) {
  if (rows.length === 0) return
  const rowH = opts?.rowHeight ?? 7
  const color = opts?.color ?? ACTION
  const labelW = 50
  const valueW = 28
  const barX = MARGIN_X + labelW
  const barW = CONTENT_W - labelW - valueW

  const max = opts?.max ?? Math.max(1, ...rows.map((r) => r.value))

  ensureSpace(doc, cur, rowH * rows.length + 4)

  rows.forEach((r, i) => {
    const y = cur.y + i * rowH

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setColor(doc, 'text', INK)
    const labelTxt = r.label.length > 28 ? r.label.slice(0, 27) + '…' : r.label
    doc.text(labelTxt, MARGIN_X, y + 4)

    setColor(doc, 'fill', FOG)
    doc.roundedRect(barX, y + 1.5, barW, rowH - 3, 1, 1, 'F')

    const wpx = max > 0 ? (r.value / max) * barW : 0
    if (wpx > 0.5) {
      setColor(doc, 'fill', color)
      doc.roundedRect(barX, y + 1.5, wpx, rowH - 3, 1, 1, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    setColor(doc, 'text', INK)
    doc.text(fmtMoney(r.value, currency, { compact: true, decimals: 0 }), PAGE_W - MARGIN_X, y + 4, {
      align: 'right',
    })
  })

  cur.y += rows.length * rowH + 6
}

function drawTable(
  doc: jsPDF,
  cur: Cursor,
  head: string[],
  body: (string | number)[][],
  opts?: { colStyles?: Record<number, { halign?: 'left' | 'right' | 'center'; cellWidth?: number }> },
) {
  if (body.length === 0) {
    ensureSpace(doc, cur, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setColor(doc, 'text', GRAPHITE)
    doc.text('No data in period.', MARGIN_X, cur.y + 4)
    cur.y += 10
    return
  }

  autoTable(doc, {
    startY: cur.y,
    margin: { left: MARGIN_X, right: MARGIN_X },
    head: [head],
    body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: INK,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: MIST,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: FOG,
      textColor: SLATE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    },
    alternateRowStyles: {
      fillColor: [251, 251, 252],
    },
    columnStyles: opts?.colStyles,
    didDrawPage: (data) => {
      cur.y = data.cursor?.y ?? cur.y
    },
  })

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
  cur.y = (finalY ?? cur.y) + 8
}

function rowsToBars(rows: ReportRow[], limit = 7) {
  return rows.slice(0, limit).map((r) => ({ label: r.vendor, value: r.total }))
}

function vendorTableBody(rows: ReportRow[], currency: string): (string | number)[][] {
  return rows.map((r) => [
    r.vendor,
    fmtInt(r.count),
    fmtMoney(r.total, currency, { decimals: 2 }),
    fmtMoney(r.avg, currency, { decimals: 2 }),
    fmtPct(r.pct, 1),
  ])
}

function invoiceTableBody(rows: LargeInvoice[]): (string | number)[][] {
  return rows.map((r) => [
    fmtDate(r.date),
    r.vendor,
    r.person,
    `${symbolFor(r.currency)} ${r.total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  ])
}

function drawFooters(doc: jsPDF) {
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setColor(doc, 'text', GRAPHITE)
    doc.text('scan-me — financial report', MARGIN_X, PAGE_H - 8)
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN_X, PAGE_H - 8, { align: 'right' })
    setColor(doc, 'draw', MIST)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_X, PAGE_H - 12, PAGE_W - MARGIN_X, PAGE_H - 12)
  }
}

export function useFinancialReportPdf() {
  function render(report: FinancialReport): Blob {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
    const cur: Cursor = { y: MARGIN_TOP }

    drawCoverHeader(doc, cur, report)
    drawKpiGrid(doc, cur, report)

    drawSectionTitle(doc, cur, 'Spend over time', 'Trend')
    const monthly: MonthlyBucket[] = report.monthly
    drawBarChart(
      doc,
      cur,
      monthly.map((m) => m.label),
      monthly.map((m) => m.total),
      report.currency,
      { height: 56, color: INK },
    )
    if (monthly.length > 0) {
      const peak = monthly.reduce((a, b) => (b.total > a.total ? b : a))
      const trough = monthly.reduce((a, b) => (b.total < a.total ? b : a))
      const avgMonthly =
        monthly.reduce((acc, m) => acc + m.total, 0) / Math.max(1, monthly.length)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      setColor(doc, 'text', SLATE)
      doc.text(
        `Peak: ${peak.label} (${fmtMoney(peak.total, report.currency, { decimals: 0 })})   ·   ` +
          `Low: ${trough.label} (${fmtMoney(trough.total, report.currency, { decimals: 0 })})   ·   ` +
          `Avg / month: ${fmtMoney(avgMonthly, report.currency, { decimals: 0 })}`,
        MARGIN_X,
        cur.y,
      )
      cur.y += 8
    }

    drawSectionTitle(doc, cur, 'Top vendors', 'Where the money goes')
    drawHorizontalBars(doc, cur, rowsToBars(report.topVendors, 7), report.currency, { color: ACTION })
    drawTable(
      doc,
      cur,
      ['Vendor', 'Invoices', 'Total', 'Avg', 'Share'],
      vendorTableBody(report.topVendors, report.currency),
      {
        colStyles: {
          1: { halign: 'right', cellWidth: 22 },
          2: { halign: 'right', cellWidth: 32 },
          3: { halign: 'right', cellWidth: 28 },
          4: { halign: 'right', cellWidth: 20 },
        },
      },
    )

    drawSectionTitle(doc, cur, 'Top categories', 'Collection roots')
    if (report.topCategories.length > 0) {
      drawHorizontalBars(doc, cur, rowsToBars(report.topCategories, 7), report.currency, {
        color: SUCCESS,
      })
      drawTable(
        doc,
        cur,
        ['Category', 'Invoices', 'Total', 'Avg', 'Share'],
        vendorTableBody(report.topCategories, report.currency),
        {
          colStyles: {
            1: { halign: 'right', cellWidth: 22 },
            2: { halign: 'right', cellWidth: 32 },
            3: { halign: 'right', cellWidth: 28 },
            4: { halign: 'right', cellWidth: 20 },
          },
        },
      )
    } else {
      ensureSpace(doc, cur, 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setColor(doc, 'text', GRAPHITE)
      doc.text('No invoices are linked to any collection in this period.', MARGIN_X, cur.y + 4)
      cur.y += 12
    }

    drawSectionTitle(doc, cur, 'Top people', 'Who the spend was for')
    if (report.topPeople.length > 0) {
      drawHorizontalBars(doc, cur, rowsToBars(report.topPeople, 7), report.currency, {
        color: ACTION,
      })
      drawTable(
        doc,
        cur,
        ['Person', 'Invoices', 'Total', 'Avg', 'Share'],
        vendorTableBody(report.topPeople, report.currency),
        {
          colStyles: {
            1: { halign: 'right', cellWidth: 22 },
            2: { halign: 'right', cellWidth: 32 },
            3: { halign: 'right', cellWidth: 28 },
            4: { halign: 'right', cellWidth: 20 },
          },
        },
      )
    } else {
      ensureSpace(doc, cur, 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setColor(doc, 'text', GRAPHITE)
      doc.text('No invoices are assigned to a person in this period.', MARGIN_X, cur.y + 4)
      cur.y += 12
    }

    if (report.byRole.length > 0) {
      drawSectionTitle(doc, cur, 'By role', 'Aggregated by person role')
      drawTable(
        doc,
        cur,
        ['Role', 'Invoices', 'Total', 'Avg', 'Share'],
        vendorTableBody(report.byRole, report.currency),
        {
          colStyles: {
            1: { halign: 'right', cellWidth: 22 },
            2: { halign: 'right', cellWidth: 32 },
            3: { halign: 'right', cellWidth: 28 },
            4: { halign: 'right', cellWidth: 20 },
          },
        },
      )
    }

    drawSectionTitle(doc, cur, 'Largest invoices', 'Top 10 by total')
    drawTable(
      doc,
      cur,
      ['Date', 'Vendor', 'Person', 'Total'],
      invoiceTableBody(report.largestInvoices),
      {
        colStyles: {
          0: { cellWidth: 26 },
          3: { halign: 'right', cellWidth: 34 },
        },
      },
    )

    drawSectionTitle(doc, cur, 'Smallest invoices', 'Bottom 10 by total (excludes zero)')
    drawTable(
      doc,
      cur,
      ['Date', 'Vendor', 'Person', 'Total'],
      invoiceTableBody(report.smallestInvoices),
      {
        colStyles: {
          0: { cellWidth: 26 },
          3: { halign: 'right', cellWidth: 34 },
        },
      },
    )

    if (report.topItems.length > 0) {
      drawSectionTitle(doc, cur, 'Top line items', 'Frequent and high-value descriptions')
      drawTable(
        doc,
        cur,
        ['Description', 'Occurrences', 'Total'],
        report.topItems.map((it) => [
          it.description,
          fmtInt(it.count),
          fmtMoney(it.total, report.currency, { decimals: 2 }),
        ]),
        {
          colStyles: {
            1: { halign: 'right', cellWidth: 30 },
            2: { halign: 'right', cellWidth: 34 },
          },
        },
      )
    }

    if (report.totals.voidedCount > 0) {
      drawSectionTitle(doc, cur, 'Voided invoices', 'Excluded from totals above')
      ensureSpace(doc, cur, 10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setColor(doc, 'text', SLATE)
      doc.text(
        `${fmtInt(report.totals.voidedCount)} invoice(s) voided in this period — ` +
          `${fmtMoney(report.totals.voidedAmount, report.currency, { decimals: 2 })} total nominal value, not counted in any KPI.`,
        MARGIN_X,
        cur.y,
        { maxWidth: CONTENT_W },
      )
      cur.y += 8
    }

    drawFooters(doc)

    return doc.output('blob')
  }

  function downloadPdf(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return { render, downloadPdf }
}
