import { describe, it, expect } from 'vitest'
import { currencySymbol, formatAmount, formatShortDate, formatLongDate } from '../../app/composables/useMoneyFormat'

describe('currencySymbol', () => {
  it('maps known ISO codes to symbols and is case-insensitive', () => {
    expect(currencySymbol('USD')).toBe('$')
    expect(currencySymbol('eur')).toBe('€')
    expect(currencySymbol('GBP')).toBe('£')
  })

  it('falls back to the raw code for unknown currencies (so display still makes sense)', () => {
    expect(currencySymbol('COP')).toBe('COP')
    expect(currencySymbol('XYZ')).toBe('XYZ')
  })

  it('returns empty string for nullish currency rather than the literal "undefined"', () => {
    expect(currencySymbol(null)).toBe('')
    expect(currencySymbol(undefined)).toBe('')
    expect(currencySymbol('')).toBe('')
  })
})

describe('formatAmount', () => {
  it('renders an em-dash for null (the missing-value sentinel used across the app)', () => {
    expect(formatAmount(null, 'USD')).toBe('—')
  })

  it('formats positive and negative amounts with two decimals', () => {
    expect(formatAmount(1234.5, 'USD')).toBe('$ 1234.50')
    expect(formatAmount(-50, 'EUR')).toBe('€ -50.00')
    expect(formatAmount(0, 'USD')).toBe('$ 0.00')
  })

  it('omits the leading space when no symbol resolves', () => {
    expect(formatAmount(10, null)).toBe('10.00')
  })
})

describe('formatShortDate / formatLongDate', () => {
  it('returns em-dash for invalid or missing dates', () => {
    expect(formatShortDate(null)).toBe('—')
    expect(formatShortDate('not-a-date')).toBe('—')
    expect(formatLongDate(undefined)).toBe('—')
  })

  it('uses the fallback when primary source is empty', () => {
    expect(formatShortDate(null, '2025-03-10')).not.toBe('—')
    expect(formatLongDate('', '2025-03-10')).toMatch(/2025/)
  })

  it('outputs uppercase month for short date and includes year for long date', () => {
    const short = formatShortDate('2025-03-10T12:00:00Z')
    const long = formatLongDate('2025-03-10T12:00:00Z')
    expect(short).toEqual(short.toUpperCase())
    expect(long).toMatch(/2025/)
  })
})
