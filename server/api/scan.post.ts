import Groq from 'groq-sdk'
import { serverSupabaseUser } from '#supabase/server'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

type SniffedMime = 'image/jpeg' | 'image/png' | 'image/webp' | null

function sniffImageMime(buf: Buffer): SniffedMime {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

const SYSTEM_PROMPT = `You are an OCR engine that extracts structured data from invoice and receipt images.

Return ONLY a JSON object that matches this TypeScript shape exactly:

{
  "vendor": string,                  // merchant name as it appears on the receipt
  "vendor_address": string | null,
  "invoice_number": string | null,
  "date": string | null,             // ISO 8601 (YYYY-MM-DD) if you can parse it, else null
  "currency": string | null,         // ISO 4217 (EUR, USD, ...) if visible, else null
  "subtotal": number | null,
  "tax": number | null,
  "tax_rate": number | null,         // 0..1 (e.g. 0.21 for 21%)
  "total": number | null,
  "items": Array<{
    "description": string,
    "quantity": number | null,
    "unit_price": number | null,
    "amount": number
  }>,
  "confidence": number                // your own 0..1 estimate of extraction quality
}

Rules:
- Output ONLY the JSON object. No prose, no markdown fences, no explanations.
- Numbers must be plain numbers (no currency symbols, no thousand separators).
- If a field is illegible or absent, use null (do not invent values).
- If the image is not an invoice or receipt, return all fields null/empty and confidence: 0.`

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const config = useRuntimeConfig()
  if (!config.groqApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Server not configured' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find((p) => p.name === 'file')

  if (!file || !file.data || file.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image uploaded' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Image too large (max 10 MB)' })
  }

  const mime = sniffImageMime(file.data)
  if (!mime) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image format (use JPEG, PNG, or WebP)' })
  }

  const dataUrl = `data:${mime};base64,${file.data.toString('base64')}`

  const groq = new Groq({ apiKey: config.groqApiKey, timeout: 60_000 })

  let completion
  try {
    completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the invoice/receipt fields from this image.' },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    })
  } catch (err) {
    console.error('[scan] groq call failed', err instanceof Error ? err.message : err)
    throw createError({ statusCode: 502, statusMessage: 'OCR provider failed. Try again.' })
  }

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw createError({ statusCode: 502, statusMessage: 'OCR returned no content' })
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[scan] groq returned non-JSON content')
    throw createError({ statusCode: 502, statusMessage: 'OCR returned malformed data' })
  }

  return parsed
})
