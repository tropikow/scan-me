import { createClient } from '@supabase/supabase-js'

type CollectionDTO = {
  id: string
  name: string
  parent_id: string | null
  position: number
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

  // Service-role client bypasses RLS because the visitor is anonymous and
  // cannot satisfy `auth.uid()` predicates on `people` / `collections`.
  const admin = createClient(supabasePublic.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: person, error: personErr } = await admin
    .from('people')
    .select('id, name, role, user_id')
    .eq('share_token', token)
    .maybeSingle()

  if (personErr) {
    console.error('[public-share] person lookup failed', personErr.message)
    throw createError({ statusCode: 500, statusMessage: 'Could not resolve share link' })
  }
  if (!person) {
    throw createError({ statusCode: 404, statusMessage: 'Share link not found' })
  }

  const { data: collectionsRaw, error: colErr } = await admin
    .from('collections')
    .select('id, name, parent_id, position')
    .eq('user_id', person.user_id)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (colErr) {
    console.error('[public-share] collections lookup failed', colErr.message)
  }

  return {
    person: { name: person.name, role: person.role },
    collections: (collectionsRaw ?? []) as CollectionDTO[],
  }
})
