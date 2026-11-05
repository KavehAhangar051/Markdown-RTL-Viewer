'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type AlignRightProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    line1: {
      initial: { x: 0 },
      animate: {
        x: [0, -2, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    line2: {
      initial: { x: 0, scaleX: 1 },
      animate: {
        x: [0, 2, 0],
        scaleX: [1, 0.75, 1],
        transformOrigin: 'right center',
        transition: { duration: 0.5, delay: 0.06, ease: 'easeInOut' },
      },
    },
    line3: {
      initial: { x: 0, scaleX: 1 },
      animate: {
        x: [0, -1.5, 0],
        scaleX: [1, 0.85, 1],
        transformOrigin: 'right center',
        transition: { duration: 0.5, delay: 0.12, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: AlignRightProps) {
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
      <motion.path
        d="M21 5H3"
        variants={variants.line1}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M21 12H9"
        variants={variants.line2}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M21 19H7"
        variants={variants.line3}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AlignRight(props: AlignRightProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  AlignRight,
  AlignRight as AlignRightIcon,
  type AlignRightProps,
  type AlignRightProps as AlignRightIconProps,
};
