import { describe, it, expect } from 'vitest'
import {
  buildCollectionRootResolver,
  buildCollectionPathLabeler,
} from '../../app/composables/useCollectionTree'

describe('buildCollectionRootResolver', () => {
  it('walks parent_id chain to the root', () => {
    const rows = [
      { id: 'a', parent_id: null },
      { id: 'b', parent_id: 'a' },
      { id: 'c', parent_id: 'b' },
    ]
    const rootOf = buildCollectionRootResolver(rows)
    expect(rootOf('c')).toBe('a')
    expect(rootOf('b')).toBe('a')
    expect(rootOf('a')).toBe('a')
  })

  it('returns the orphan node id itself when parent_id points at a non-existent row (avoids dropping data)', () => {
    const rows = [{ id: 'orphan', parent_id: 'ghost-parent' }]
    const rootOf = buildCollectionRootResolver(rows)
    expect(rootOf('orphan')).toBe('orphan')
  })

  it('does not infinite-loop on a parent_id cycle (safety cap)', () => {
    const rows = [
      { id: 'a', parent_id: 'b' },
      { id: 'b', parent_id: 'a' },
    ]
    const rootOf = buildCollectionRootResolver(rows)
    const start = Date.now()
    const result = rootOf('a')
    expect(Date.now() - start).toBeLessThan(100)
    expect(typeof result).toBe('string')
  })

  it('returns null for an id that does not exist in the dataset', () => {
    const rootOf = buildCollectionRootResolver([{ id: 'a', parent_id: null }])
    expect(rootOf('nope')).toBeNull()
  })
})

describe('buildCollectionPathLabeler', () => {
  it('builds a separator-joined path from root to leaf', () => {
    const rows = [
      { id: 'a', parent_id: null, name: 'Casa' },
      { id: 'b', parent_id: 'a', name: 'Luz' },
      { id: 'c', parent_id: 'b', name: 'Recibo' },
    ]
    const labelFor = buildCollectionPathLabeler(rows)
    const leaf = rows[2]!
    expect(labelFor(leaf)).toBe('Casa › Luz › Recibo')
  })

  it('accepts a custom separator', () => {
    const rows = [
      { id: 'a', parent_id: null, name: 'Top' },
      { id: 'b', parent_id: 'a', name: 'Sub' },
    ]
    const labelFor = buildCollectionPathLabeler(rows, ' / ')
    expect(labelFor(rows[1]!)).toBe('Top / Sub')
  })

  it('does not infinite-loop on a cycle', () => {
    const rows = [
      { id: 'a', parent_id: 'b', name: 'A' },
      { id: 'b', parent_id: 'a', name: 'B' },
    ]
    const labelFor = buildCollectionPathLabeler(rows)
    const start = Date.now()
    const label = labelFor(rows[0]!)
    expect(Date.now() - start).toBeLessThan(100)
    expect(label.length).toBeGreaterThan(0)
  })
})
