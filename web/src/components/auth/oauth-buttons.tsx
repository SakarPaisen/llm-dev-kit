'use client'

import { Building2, Github } from 'lucide-react'
import { signIn } from 'next-auth/react'
import * as React from 'react'

import { Button } from '@/components/ui/button'

interface OAuthButtonsProps {
  github: boolean
  /** Single sign-on through the organisation's Keycloak. */
  sso?: boolean
  callbackUrl: string
}

export function OAuthButtons({ github, sso = false, callbackUrl }: OAuthButtonsProps) {
  const [pending, setPending] = React.useState(false)

  if (!github && !sso) return null

  const start = (provider: string) => {
    setPending(true)
    void signIn(provider, { callbackUrl })
  }

  return (
    <>
      <div className="space-y-2">
        {sso && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => start('keycloak')}
          >
            <Building2 className="size-4" />
            Continue with single sign-on
          </Button>
        )}
        {github && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={pending}
            onClick={() => start('github')}
          >
            <Github className="size-4" />
            Continue with GitHub
          </Button>
        )}
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground">
            or
          </span>
        </div>
      </div>
    </>
  )
}
