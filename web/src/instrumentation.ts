/**
 * Runs once when the server starts. Databases from before roles existed have
 * users but no admin; promote the earliest one so the instance is manageable.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { ensureAdmin } = await import('@/server/identity/admin')
  try {
    await ensureAdmin()
  } catch (error) {
    // The schema may not exist yet in a fresh dev checkout; registration
    // runs the same check, so nothing is lost.
    console.warn('ensureAdmin at startup failed:', error)
  }
}
