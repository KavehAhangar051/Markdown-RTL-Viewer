'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type WrapTextProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    topLine: {},
    bottomLine: {},
    wrapCurve: {
      initial: { pathLength: 1 },
      animate: {
        pathLength: [0.3, 1],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    arrowHead: {
      initial: { x: 0 },
      animate: {
        x: [0, -2, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: WrapTextProps) {
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
        d="M3 5h18"
        variants={variants.topLine}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3 12h14.5a1 1 0 0 1 0 7H13"
        variants={variants.wrapCurve}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m16 16-3 3 3 3"
        variants={variants.arrowHead}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3 19h6"
        variants={variants.bottomLine}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function WrapText(props: WrapTextProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  WrapText,
  WrapText as WrapTextIcon,
  type WrapTextProps,
  type WrapTextProps as WrapTextIconProps,
};
