import { serverSupabaseUser } from '#supabase/server'

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
  if (file.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Image too large (max 10 MB)' })
  }

  const mime = sniffImageMime(file.data)
  if (!mime) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image format (use JPEG, PNG, or WebP)' })
  }

  const dataUrl = `data:${mime};base64,${file.data.toString('base64')}`
  return await runOcr(config.groqApiKey, dataUrl, 'scan')
})
