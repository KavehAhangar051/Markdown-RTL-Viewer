'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type CaseSensitiveProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    upper: {
      initial: { y: 0 },
      animate: {
        y: [0, -2, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    lower: {
      initial: { y: 0 },
      animate: {
        y: [0, -2, 0],
        transition: { duration: 0.45, delay: 0.1, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CaseSensitiveProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <motion.g variants={variants.upper} initial="initial" animate={controls}>
        <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />
        <path d="M3.304 13h6.392" />
      </motion.g>
      <motion.g variants={variants.lower} initial="initial" animate={controls}>
        <path d="M22 9v7" />
        <circle cx="18.5" cy="12.5" r="3.5" />
      </motion.g>
    </motion.svg>
  );
}

function CaseSensitive(props: CaseSensitiveProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  CaseSensitive,
  CaseSensitive as CaseSensitiveIcon,
  type CaseSensitiveProps,
  type CaseSensitiveProps as CaseSensitiveIconProps,
};
