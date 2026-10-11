import 'server-only'

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

/**
 * AES-256-GCM with a key derived from AUTH_SECRET, for the signing keys'
 * private halves. Changing AUTH_SECRET makes existing ciphertexts unreadable,
 * which the key store treats as "rotate now".
 */
function keyFrom(secret: string): Buffer {
  return Buffer.from(
    hkdfSync('sha256', secret, 'llm-dev-kit', 'identity-signing-key-encryption', 32),
  )
}

export function seal(plaintext: string, secret: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv)
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64url')).join('.')
}

/** Returns null when the ciphertext is malformed or was sealed with another secret. */
export function open(sealed: string, secret: string): string | null {
  const [iv, tag, data] = sealed.split('.').map((part) => Buffer.from(part, 'base64url'))
  if (!iv || !tag || !data) return null
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
