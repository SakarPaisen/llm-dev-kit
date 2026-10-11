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
      <BrandMark size="lg" className="mb-6 animate-rise-in" />

      <h2
        className="animate-rise-in text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{ animationDelay: '60ms' }}
      >
        How can I help you today?
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
                'group flex h-full w-full items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors',
                'hover:border-primary/40 hover:bg-accent/50',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
