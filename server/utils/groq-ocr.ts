import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are an OCR engine that extracts structured data from invoice and receipt images.

Return ONLY a JSON object that matches this TypeScript shape exactly:

{
  "vendor": string,
  "vendor_address": string | null,
  "invoice_number": string | null,
  "date": string | null,
  "currency": string | null,
  "subtotal": number | null,
  "tax": number | null,
  "tax_rate": number | null,
  "total": number | null,
  "items": Array<{
    "description": string,
    "quantity": number | null,
    "unit_price": number | null,
    "amount": number
  }>,
  "confidence": number
}

Rules:
- Output ONLY the JSON object. No prose, no markdown fences, no explanations.
- Numbers must be plain numbers (no currency symbols, no thousand separators).
- If a field is illegible or absent, use null (do not invent values).
- If the image is not an invoice or receipt, return all fields null/empty and confidence: 0.`

export async function runOcr(apiKey: string, dataUrl: string, logTag: string): Promise<unknown> {
  const groq = new Groq({ apiKey, timeout: 60_000 })

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
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    })
  } catch (err) {
    console.error(`[${logTag}] groq call failed`, err instanceof Error ? err.message : err)
    throw createError({ statusCode: 502, statusMessage: 'OCR provider failed. Try again.' })
  }

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw createError({ statusCode: 502, statusMessage: 'OCR returned no content' })
  }

  try {
    return JSON.parse(raw)
  } catch {
    console.error(`[${logTag}] groq returned non-JSON content`)
    throw createError({ statusCode: 502, statusMessage: 'OCR returned malformed data' })
  }
}
