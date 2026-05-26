// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMock = vi.fn()

vi.mock('groq-sdk', () => {
  class Groq {
    chat = { completions: { create: createMock } }
  }
  return { default: Groq }
})

// runOcr calls h3's createError; stub it as a global since the SUT depends on Nitro's auto-import.
;(globalThis as unknown as { createError: (e: { statusCode: number; statusMessage: string }) => Error }).createError = (e) => {
  const err = new Error(e.statusMessage) as Error & { statusCode: number }
  err.statusCode = e.statusCode
  return err
}

import { runOcr } from '../../../server/utils/groq-ocr'

function mockGroqResponse(content: string | null) {
  createMock.mockResolvedValueOnce({ choices: [{ message: { content } }] })
}

describe('runOcr', () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  it('parses valid JSON and preserves the OCR schema fields', async () => {
    mockGroqResponse(JSON.stringify({
      vendor: 'Acme Test Co',
      total: 42.5,
      currency: 'USD',
      items: [{ description: 'Widget', quantity: 2, unit_price: 21.25, amount: 42.5 }],
      confidence: 0.9,
    }))
    const result = await runOcr('fake-key', 'data:image/jpeg;base64,AAAA', 'test') as Record<string, unknown>
    expect(result.vendor).toBe('Acme Test Co')
    expect(result.total).toBe(42.5)
    expect(Array.isArray(result.items)).toBe(true)
  })

  it('throws a 502 when Groq returns malformed JSON', async () => {
    mockGroqResponse('not-json-at-all{{{')
    await expect(runOcr('fake-key', 'data:image/jpeg;base64,AAAA', 'test'))
      .rejects.toMatchObject({ statusCode: 502, message: 'OCR returned malformed data' })
  })

  it('throws a 502 when Groq returns empty content', async () => {
    mockGroqResponse(null)
    await expect(runOcr('fake-key', 'data:image/jpeg;base64,AAAA', 'test'))
      .rejects.toMatchObject({ statusCode: 502, message: 'OCR returned no content' })
  })

  it('translates SDK failures into a 502 (no leaked stack trace)', async () => {
    createMock.mockRejectedValueOnce(new Error('upstream-503'))
    await expect(runOcr('fake-key', 'data:image/jpeg;base64,AAAA', 'test'))
      .rejects.toMatchObject({ statusCode: 502, message: 'OCR provider failed. Try again.' })
  })
})
