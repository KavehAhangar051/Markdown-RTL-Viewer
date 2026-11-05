'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type DatabaseProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    top: {
      initial: { y: 0 },
      animate: {
        y: [0, -1.5, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    mid: {
      initial: { pathLength: 1, opacity: 1 },
      animate: {
        pathLength: [0.3, 1],
        opacity: [0.5, 1],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    body: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: DatabaseProps) {
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
      <motion.ellipse
        cx="12"
        cy="5"
        rx="9"
        ry="3"
        variants={variants.top}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3 5V19A9 3 0 0 0 21 19V5"
        variants={variants.body}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3 12A9 3 0 0 0 21 12"
        variants={variants.mid}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Database(props: DatabaseProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Database,
  Database as DatabaseIcon,
  type DatabaseProps,
  type DatabaseProps as DatabaseIconProps,
};
