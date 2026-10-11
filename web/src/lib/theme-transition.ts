export type ThemeChoice = 'light' | 'dark' | 'system'

interface Origin {
  x: number
  y: number
}

/** Whether a media query matches; false where matchMedia is unavailable. */
function matches(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
}

/**
 * Switch theme with the new one revealed as a circle growing from `origin`
 * (the click point), using the View Transitions API.
 *
 * next-themes applies its class in an effect, after the transition has taken
 * its "new" snapshot, so the class is applied here synchronously as well;
 * next-themes then sets the same class, a no-op. Falls back to an instant
 * switch where the API is missing or motion is reduced.
 */
export function switchTheme(
  next: ThemeChoice,
  setTheme: (theme: string) => void,
  origin?: Origin,
): void {
  const prefersDark = matches('(prefers-color-scheme: dark)')
  const resolved = next === 'system' ? (prefersDark ? 'dark' : 'light') : next

  const apply = () => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.classList.toggle('light', resolved === 'light')
    root.style.colorScheme = resolved
    setTheme(next)
  }

  const reduceMotion = matches('(prefers-reduced-motion: reduce)')
  if (typeof document.startViewTransition !== 'function' || reduceMotion) {
    apply()
    return
  }

  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? 0
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  const transition = document.startViewTransition(apply)
  void transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      {
        duration: 480,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}

/** The centre of an element, for revealing from the control that was used. */
export function originOf(element: Element | null): Origin | undefined {
  if (!element) return undefined
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
