'use client';

import { useId } from 'react';
import { Button, DemoNote, TextField, cn, useDemoNote } from '@/strata/ui';

/**
 * Newsletter field (STORYBOARD 7.10): no form and nothing sent. The helper and the demo note share one line, so
 * pressing Subscribe swaps the helper for the note instead of stacking two "Demo site" lines.
 */
export function NewsletterField({ className }: { className?: string }) {
  const subscribe = useDemoNote();
  const hintId = useId();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <TextField
        label="Work email"
        type="email"
        name="work-email"
        autoComplete="email"
        placeholder="you@company.com"
        aria-describedby={hintId}
        onKeyDown={(e) => {
          if (e.key === 'Enter') subscribe.show();
        }}
        trailing={
          <Button size="sm" magnetic={false} className="min-h-11" {...subscribe.buttonProps}>
            Subscribe
          </Button>
        }
      />
      <div className="grid">
        <p
          id={hintId}
          className={cn(
            'text-caption text-text-3 transition-opacity duration-[var(--duration-base)] [grid-area:1/1]',
            subscribe.shown && 'opacity-0',
          )}
        >
          Demo site: nothing is sent.
        </p>
        <DemoNote {...subscribe.noteProps} className="[grid-area:1/1]" />
      </div>
    </div>
  );
}
