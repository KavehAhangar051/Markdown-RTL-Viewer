'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type PenBoxProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    box: {},
    pen: {
      initial: { x: 0, y: 0, rotate: 0 },
      animate: {
        x: [0, 1.2, -0.8, 0],
        y: [0, -1.2, 0.8, 0],
        rotate: [0, -6, 4, 0],
        transformOrigin: '14px 10px',
        transition: { duration: 0.55, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: PenBoxProps) {
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
        d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        variants={variants.box}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
        variants={variants.pen}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function PenBox(props: PenBoxProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  PenBox,
  PenBox as PenBoxIcon,
  type PenBoxProps,
  type PenBoxProps as PenBoxIconProps,
};
