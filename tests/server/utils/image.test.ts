// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { sniffImageMime, MIME_TO_EXT, MAX_IMAGE_BYTES } from '../../../server/utils/image'

function buf(...bytes: number[]): Buffer {
  const padding = Math.max(0, 12 - bytes.length)
  return Buffer.from([...bytes, ...Array(padding).fill(0)])
}

describe('sniffImageMime', () => {
  it('identifies JPEG by FF D8 FF magic', () => {
    expect(sniffImageMime(buf(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
  })

  it('identifies PNG by full 8-byte signature', () => {
    expect(sniffImageMime(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
  })

  it('identifies WebP by RIFF...WEBP container', () => {
    expect(sniffImageMime(buf(0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50))).toBe('image/webp')
  })

  it('returns null for unknown bytes and avoids accepting RIFF without WEBP marker', () => {
    expect(sniffImageMime(buf(0x00, 0x01, 0x02, 0x03))).toBeNull()
    expect(sniffImageMime(buf(0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20))).toBeNull()
  })

  it('returns null when the buffer is too short to sniff safely', () => {
    expect(sniffImageMime(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull()
  })
})

describe('MIME_TO_EXT and limits', () => {
  it('maps every supported MIME to a non-empty extension', () => {
    expect(MIME_TO_EXT['image/jpeg']).toBe('jpg')
    expect(MIME_TO_EXT['image/png']).toBe('png')
    expect(MIME_TO_EXT['image/webp']).toBe('webp')
  })

  it('caps uploads at 10 MB', () => {
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024)
  })
})
