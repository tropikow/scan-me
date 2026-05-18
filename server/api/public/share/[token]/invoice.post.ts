import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const MAX_BYTES = 10 * 1024 * 1024
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SniffedMime = 'image/jpeg' | 'image/png' | 'image/webp' | null

function sniffImageMime(buf: Buffer): SniffedMime {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'image/png'
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp'
  return null
}

const MIME_TO_EXT: Record<NonNullable<SniffedMime>, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

type IncomingItem = {
  description?: unknown
  quantity?: unknown
  unit_price?: unknown
  amount?: unknown
}

type IncomingPayload = {
  vendor?: unknown
  vendor_address?: unknown
  invoice_number?: unknown
  date?: unknown
  currency?: unknown
  subtotal?: unknown
  tax?: unknown
  tax_rate?: unknown
  total?: unknown
  confidence?: unknown
  tags?: unknown
  notes?: unknown
  items?: unknown
  collection_id?: unknown
}

function toUuid(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return UUID_RE.test(s) ? s.toLowerCase() : null
}
function toStr(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  return s.slice(0, max)
}
function toNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}
function toDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}
function toTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((t) => (typeof t === 'string' ? t.trim().slice(0, 40) : null))
    .filter((t): t is string => !!t)
    .slice(0, 20)
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token || !UUID_RE.test(token)) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found' })
  }

  const config = useRuntimeConfig(event)
  const supabasePublic = (config.public as { supabase: { url: string; key: string } }).supabase
  const serviceKey = (config as { supabaseServiceRoleKey?: string }).supabaseServiceRoleKey
  if (!serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Server not configured' })
  }

  const admin = createClient(supabasePublic.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })

  const { data: person, error: personErr } = await admin
    .from('people')
    .select('id, user_id')
    .eq('share_token', token)
    .maybeSingle()
  if (personErr) {
    console.error('[public-share/invoice] person lookup failed', personErr.message)
    throw createError({ statusCode: 500, statusMessage: 'Could not resolve share link' })
  }
  if (!person) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found' })
  }

  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'Expected multipart form data' })
  }
  const filePart = form.find((p) => p.name === 'file')
  const payloadPart = form.find((p) => p.name === 'payload')

  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image file' })
  }
  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Image too large (max 10 MB)' })
  }
  const mime = sniffImageMime(filePart.data)
  if (!mime) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image format' })
  }

  let payload: IncomingPayload = {}
  if (payloadPart?.data) {
    try {
      payload = JSON.parse(payloadPart.data.toString('utf8')) as IncomingPayload
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Malformed payload JSON' })
    }
  }

  // If a collection_id is provided, it MUST belong to the link's owner.
  // This stops a tampered payload from attaching the invoice to a collection
  // that belongs to a different account.
  const collectionId = toUuid(payload.collection_id)
  if (collectionId) {
    const { data: col, error: colErr } = await admin
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', person.user_id)
      .maybeSingle()
    if (colErr || !col) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid collection' })
    }
  }

  const invoiceId = randomUUID()
  const objectPath = `${person.user_id}/${invoiceId}.${MIME_TO_EXT[mime]}`

  const { error: uploadErr } = await admin.storage
    .from('receipts')
    .upload(objectPath, filePart.data, { contentType: mime, upsert: false })
  if (uploadErr) {
    console.error('[public-share/invoice] storage upload failed', {
      err: uploadErr.message,
      ownerId: person.user_id,
      path: objectPath
    })
    throw createError({ statusCode: 502, statusMessage: 'Failed to store image' })
  }

  const invoiceRow = {
    id: invoiceId,
    user_id: person.user_id,
    vendor: toStr(payload.vendor, 200),
    vendor_address: toStr(payload.vendor_address, 500),
    invoice_number: toStr(payload.invoice_number, 80),
    invoice_date: toDate(payload.date),
    currency: toStr(payload.currency, 8),
    subtotal: toNum(payload.subtotal),
    tax: toNum(payload.tax),
    tax_rate: toNum(payload.tax_rate),
    total: toNum(payload.total),
    confidence: toNum(payload.confidence),
    notes: toStr(payload.notes, 2000),
    tags: toTags(payload.tags),
    image_path: objectPath,
    person_id: person.id
  }

  const { error: insertErr } = await admin.from('invoices').insert(invoiceRow)
  if (insertErr) {
    await admin.storage.from('receipts').remove([objectPath])
    console.error('[public-share/invoice] insert failed', insertErr.message)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save invoice' })
  }

  const rawItems = Array.isArray(payload.items) ? (payload.items as IncomingItem[]) : []
  const itemRows = rawItems
    .map((it, idx) => {
      const description = toStr(it.description, 300)
      const amount = toNum(it.amount)
      if (!description || amount == null) return null
      return {
        invoice_id: invoiceId,
        position: idx,
        description,
        quantity: toNum(it.quantity),
        unit_price: toNum(it.unit_price),
        amount
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (itemRows.length > 0) {
    const { error: itemsErr } = await admin.from('invoice_items').insert(itemRows)
    if (itemsErr) {
      console.error('[public-share/invoice] items insert failed', itemsErr.message)
    }
  }

  if (collectionId) {
    const { error: linkErr } = await admin
      .from('invoice_collections')
      .insert({ invoice_id: invoiceId, collection_id: collectionId })
    if (linkErr) {
      console.warn('[public-share/invoice] collection link failed', linkErr.message)
    }
  }

  return { id: invoiceId }
})
