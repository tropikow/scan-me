// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UUID_RE, toUuid, toStr, toNum, toDate, toTags } from '../../../server/utils/validate'

describe('UUID_RE / toUuid', () => {
  it('accepts a valid v4 UUID and lowercases it', () => {
    expect(UUID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    expect(toUuid('550E8400-E29B-41D4-A716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('trims surrounding whitespace before validating', () => {
    expect(toUuid('  550e8400-e29b-41d4-a716-446655440000  ')).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('rejects malformed strings, non-strings, and SQL-injection-shaped inputs', () => {
    expect(toUuid('not-a-uuid')).toBeNull()
    expect(toUuid('')).toBeNull()
    expect(toUuid(null)).toBeNull()
    expect(toUuid(123)).toBeNull()
    expect(toUuid("550e8400-e29b-41d4-a716-446655440000' OR 1=1--")).toBeNull()
    expect(toUuid('550e8400e29b41d4a716446655440000')).toBeNull()
  })
})

describe('toNum', () => {
  it('returns finite numbers as-is and parses numeric strings', () => {
    expect(toNum(42)).toBe(42)
    expect(toNum(-3.14)).toBe(-3.14)
    expect(toNum('  12.5 ')).toBe(12.5)
    expect(toNum(0)).toBe(0)
  })

  it('rejects NaN, Infinity and non-numeric input — guards against bad OCR output', () => {
    expect(toNum(NaN)).toBeNull()
    expect(toNum(Infinity)).toBeNull()
    expect(toNum(-Infinity)).toBeNull()
    expect(toNum('abc')).toBeNull()
    expect(toNum('')).toBeNull()
    expect(toNum('   ')).toBeNull()
    expect(toNum(null)).toBeNull()
    expect(toNum({})).toBeNull()
  })
})

describe('toDate', () => {
  it('accepts only strict YYYY-MM-DD strings', () => {
    expect(toDate('2025-01-15')).toBe('2025-01-15')
  })

  it('rejects any other date shape (ISO with time, slashes, partial)', () => {
    expect(toDate('2025-1-1')).toBeNull()
    expect(toDate('2025/01/15')).toBeNull()
    expect(toDate('2025-01-15T10:00:00Z')).toBeNull()
    expect(toDate('15-01-2025')).toBeNull()
    expect(toDate(null)).toBeNull()
    expect(toDate(20250115)).toBeNull()
  })
})

describe('toStr', () => {
  it('truncates to maxLen and trims', () => {
    expect(toStr('  hello  ')).toBe('hello')
    expect(toStr('abcdefghij', 5)).toBe('abcde')
  })

  it('returns null for empty / whitespace / non-strings', () => {
    expect(toStr('   ')).toBeNull()
    expect(toStr('')).toBeNull()
    expect(toStr(null)).toBeNull()
    expect(toStr(42)).toBeNull()
  })
})

describe('toTags', () => {
  it('caps tag count at 20 and length at 40', () => {
    const longTag = 'x'.repeat(100)
    const many = Array.from({ length: 30 }, (_, i) => `tag${i}`)
    expect(toTags([longTag])[0]).toHaveLength(40)
    expect(toTags(many)).toHaveLength(20)
  })

  it('filters out non-string and empty entries, trims survivors', () => {
    expect(toTags(['  a  ', '', null, 5, 'b'])).toEqual(['a', 'b'])
  })

  it('returns [] for non-arrays', () => {
    expect(toTags(null)).toEqual([])
    expect(toTags('not-array')).toEqual([])
    expect(toTags({})).toEqual([])
  })
})
