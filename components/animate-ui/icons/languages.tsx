'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type LanguagesProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    scriptLeft: {
      initial: { x: 0, y: 0 },
      animate: {
        x: [0, -1, 0],
        y: [0, -1, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    scriptRight: {
      initial: { x: 0, y: 0 },
      animate: {
        x: [0, 1, 0],
        y: [0, 1, 0],
        transition: { duration: 0.45, delay: 0.08, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: LanguagesProps) {
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
      <motion.g variants={variants.scriptLeft} initial="initial" animate={controls}>
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
      </motion.g>
      <motion.g variants={variants.scriptRight} initial="initial" animate={controls}>
        <path d="m22 22-5-10-5 10" />
        <path d="M14 18h6" />
      </motion.g>
    </motion.svg>
  );
}

function Languages(props: LanguagesProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Languages,
  Languages as LanguagesIcon,
  type LanguagesProps,
  type LanguagesProps as LanguagesIconProps,
};
