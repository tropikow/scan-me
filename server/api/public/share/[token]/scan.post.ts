import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token || !UUID_RE.test(token)) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found' })
  }

  const config = useRuntimeConfig(event)
  if (!config.groqApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Server not configured' })
  }
  const supabasePublic = (config.public as { supabase: { url: string; key: string } }).supabase
  const serviceKey = (config as { supabaseServiceRoleKey?: string }).supabaseServiceRoleKey
  if (!serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Server not configured' })
  }

  const admin = createClient(supabasePublic.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { data: person, error: personErr } = await admin
    .from('people')
    .select('id')
    .eq('share_token', token)
    .maybeSingle()
  if (personErr || !person) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found' })
  }

  const form = await readMultipartFormData(event)
  const file = form?.find((p) => p.name === 'file')
  if (!file || !file.data || file.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image uploaded' })
  }
  if (file.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Image too large (max 10 MB)' })
  }
  const mime = sniffImageMime(file.data)
  if (!mime) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image format (use JPEG, PNG, or WebP)' })
  }

  const dataUrl = `data:${mime};base64,${file.data.toString('base64')}`
  return await runOcr(config.groqApiKey, dataUrl, 'public-share/scan')
})
