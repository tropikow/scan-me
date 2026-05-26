export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function toUuid(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return UUID_RE.test(s) ? s.toLowerCase() : null
}

export function toStr(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  return s.slice(0, max)
}

export function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function toDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

export function toTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((t) => (typeof t === 'string' ? t.trim().slice(0, 40) : null))
    .filter((t): t is string => !!t)
    .slice(0, 20)
}
