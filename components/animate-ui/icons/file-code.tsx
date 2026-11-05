'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type FileCodeProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    file: {},
    fold: {},
    leftBracket: {
      initial: { x: 0 },
      animate: {
        x: [0, -1.5, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    rightBracket: {
      initial: { x: 0 },
      animate: {
        x: [0, 1.5, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: FileCodeProps) {
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
        d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
        variants={variants.file}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M14 2v5a1 1 0 0 0 1 1h5"
        variants={variants.fold}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M10 12.5 8 15l2 2.5"
        variants={variants.leftBracket}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="m14 12.5 2 2.5-2 2.5"
        variants={variants.rightBracket}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function FileCode(props: FileCodeProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  FileCode,
  FileCode as FileCodeIcon,
  type FileCodeProps,
  type FileCodeProps as FileCodeIconProps,
};
