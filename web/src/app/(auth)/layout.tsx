import { AuroraBackdrop } from '@/components/brand/aurora-backdrop'
import { BrandMark } from '@/components/brand/brand-mark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <AuroraBackdrop />

      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" animated className="mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">
            LLM <span className="text-aurora">Dev Kit</span>
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
