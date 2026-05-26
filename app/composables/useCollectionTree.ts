type WithParent = { id: string; parent_id: string | null }

export function buildCollectionRootResolver<T extends WithParent>(rows: T[]) {
  const byId = new Map(rows.map((r) => [r.id, r] as const))
  const cache = new Map<string, string | null>()

  return function rootOf(id: string): string | null {
    const cached = cache.get(id)
    if (cached !== undefined) return cached
    let cur: T | undefined = byId.get(id)
    let safety = 0
    while (cur && cur.parent_id && safety < 50) {
      const next = byId.get(cur.parent_id)
      if (!next) break
      cur = next
      safety++
    }
    const rootId = cur?.id ?? null
    cache.set(id, rootId)
    return rootId
  }
}

type Named = WithParent & { name: string }

export function buildCollectionPathLabeler<T extends Named>(rows: T[], separator = ' › ') {
  const byId = new Map(rows.map((r) => [r.id, r] as const))

  return function labelFor(row: T): string {
    const chain: string[] = []
    let cur: T | undefined = row
    let safety = 0
    while (cur && safety < 50) {
      chain.unshift(cur.name)
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
      safety++
    }
    return chain.join(separator)
  }
}
