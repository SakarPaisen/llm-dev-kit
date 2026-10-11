'use client'

import { BookOpen, Bug, FileText, Sparkles } from 'lucide-react'

import { BrandMark } from '@/components/brand/brand-mark'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  {
    icon: FileText,
    title: 'Summarise my documents',
    prompt:
      'Summarise the key points from the documents you have indexed, grouped by topic.',
  },
  {
    icon: Bug,
    title: 'Debug an error',
    prompt:
      'I am seeing this error and cannot work out why:\n\n```\n\n```\n\nWhat are the likely causes?',
  },
  {
    icon: BookOpen,
    title: 'Explain a concept',
    prompt:
      'Explain how retrieval-augmented generation works, and when it beats fine-tuning.',
  },
  {
    icon: Sparkles,
    title: 'Draft something',
    prompt: 'Draft a concise release note for a change that ',
  },
] as const

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function PromptSuggestions({ onSelect, disabled }: PromptSuggestionsProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 animate-rise-in">
        {/* A soft halo behind the mark. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 scale-[2.2] rounded-full bg-aurora opacity-30 blur-2xl" />
        <BrandMark size="lg" animated />
      </div>

      <h2
        className="animate-rise-in text-3xl font-semibold tracking-tight sm:text-4xl"
        style={{ animationDelay: '60ms' }}
      >
        How can I <span className="text-aurora">help you</span> today?
      </h2>
      <p
        className="mt-3 max-w-md animate-rise-in text-sm text-muted-foreground"
        style={{ animationDelay: '120ms' }}
      >
        Ask anything. Answers are grounded in the documents indexed by your
        retrieval service, and everything runs on your own machine.
      </p>

      <ul className="mt-10 grid w-full gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }, index) => (
          <li
            key={title}
            className="animate-rise-in"
            style={{ animationDelay: `${200 + index * 70}ms` }}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(prompt)}
              className={cn(
                'glass group relative flex h-full w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300',
                'hover:-translate-y-1 hover:glow-aurora focus-visible:glow-aurora',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-aurora text-white shadow-[0_8px_20px_-8px_hsl(var(--aurora-1)/0.8)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                  {prompt.replace(/```/g, '').trim()}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
