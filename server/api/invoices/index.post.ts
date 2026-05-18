import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import {
  serverSupabaseClient,
  serverSupabaseSession,
  serverSupabaseUser
} from '#supabase/server'

const MAX_BYTES = 10 * 1024 * 1024

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
  person_id?: unknown
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
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
  const m = v.match(/^\d{4}-\d{2}-\d{2}$/)
  return m ? v : null
}
function toTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((t) => (typeof t === 'string' ? t.trim().slice(0, 40) : null))
    .filter((t): t is string => !!t)
    .slice(0, 20)
}

export default defineEventHandler(async (event) => {
  const claims = await serverSupabaseUser(event)
  const userId = (claims as { sub?: string } | null)?.sub
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
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

  const supabase = await serverSupabaseClient(event)
  const session = await serverSupabaseSession(event)
  if (!session?.access_token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing session' })
  }

  const runtimeConfig = useRuntimeConfig(event)
  const supabasePublic = (runtimeConfig.public as { supabase: { url: string; key: string } }).supabase

  // Storage REST requires the user's JWT in the Authorization header for RLS to
  // evaluate auth.uid() correctly. We build a dedicated client that pins the token,
  // because the SSR-cookie-based client doesn't always forward it to storage calls.
  const storageClient = createClient(supabasePublic.url, supabasePublic.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${session.access_token}` } }
  })

  const invoiceId = randomUUID()
  const objectPath = `${userId}/${invoiceId}.${MIME_TO_EXT[mime]}`

  const { error: uploadErr } = await storageClient.storage
    .from('receipts')
    .upload(objectPath, filePart.data, { contentType: mime, upsert: false })

  if (uploadErr) {
    console.error('[invoices] storage upload failed', {
      err: uploadErr.message,
      userId: userId,
      path: objectPath
    })
    throw createError({ statusCode: 502, statusMessage: 'Failed to store image' })
  }

  // Resolve and validate the optional person link. RLS on `people` ensures
  // the lookup only matches rows owned by the current user, so cross-tenant
  // assignment is impossible even if the client tampers with the UUID.
  let personId: string | null = toUuid(payload.person_id)
  if (personId) {
    const { data: personRow, error: personErr } = await supabase
      .from('people')
      .select('id')
      .eq('id', personId)
      .maybeSingle()
    if (personErr || !personRow) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid person assignment' })
    }
  }

  const invoiceRow = {
    id: invoiceId,
    user_id: userId,
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
    person_id: personId
  }

  const { error: insertErr } = await supabase.from('invoices').insert(invoiceRow)
  if (insertErr) {
    await storageClient.storage.from('receipts').remove([objectPath])
    console.error('[invoices] insert failed', insertErr.message)
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
    const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows)
    if (itemsErr) {
      console.error('[invoices] items insert failed', itemsErr.message)
    }
  }

  return { id: invoiceId }
})
