import { PageBackdrop } from '@/components/brand/page-backdrop'
import { BrandMark } from '@/components/brand/brand-mark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <PageBackdrop />

      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" className="mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">
            LLM Dev Kit
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your private, local-first AI workspace
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
