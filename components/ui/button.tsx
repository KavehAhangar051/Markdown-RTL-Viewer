'use client';

/**
 * @file components/ui/button.tsx
 * @description Accessible Glassmorphic button component supporting variant and size props.
 */

import React from 'react';
import { clsx } from 'clsx';
import { Slot } from '@radix-ui/react-slot';
import { m, useReducedMotion } from 'motion/react';
import { SPRING_PRESS } from '@/lib/ease';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  /** Disable tactile scale-on-press feedback when motion would distract. */
  static?: boolean;
}

const BASE_STYLES =
  'inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer touch-manipulation';

const BUTTON_VARIANTS = {
  primary:
    'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 dark:border-zinc-200 font-semibold shadow-md',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 dark:text-zinc-100 dark:border-zinc-800 shadow-sm backdrop-blur-md',
  outline:
    'border border-zinc-300 hover:border-zinc-400 bg-white/70 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:bg-black/60 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900/60 backdrop-blur-md',
  ghost:
    'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60 backdrop-blur-sm',
  danger:
    'bg-red-600 hover:bg-red-500 text-white backdrop-blur-md border border-red-500/30 shadow-md shadow-red-950/40',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-2 text-xs gap-1.5 min-h-[36px] sm:min-h-[34px]',
  md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-base gap-2.5 min-h-[48px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, static: isStatic = false, disabled, ...props }, ref) => {
    const reduceMotion = useReducedMotion();

    const combinedClassName = clsx(BASE_STYLES, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={combinedClassName}
          {...props}
        />
      );
    }

    const disableMotion = Boolean(reduceMotion || disabled || isStatic);

    return (
      <m.button
        ref={ref}
        disabled={disabled}
        whileTap={disableMotion ? undefined : { scale: 0.96 }}
        whileHover={disableMotion ? undefined : { scale: 1.01 }}
        transition={SPRING_PRESS}
        className={combinedClassName}
        // SAFETY: ButtonProps extends HTMLMotionProps<'button'>; attributes safely pass to motion.button
        {...(props as React.ComponentPropsWithoutRef<typeof m.button>)}
      />
    );
  }
);

Button.displayName = 'Button';

