'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type Columns2Props = IconProps<keyof typeof animations>;

const animations = {
  default: {
    rect: {},
    divider: {
      initial: { x: 0 },
      animate: {
        x: [0, -2.5, 2.5, 0],
        transition: { duration: 0.55, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: Columns2Props) {
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
      <motion.rect
        width={18}
        height={18}
        x={3}
        y={3}
        rx={2}
        variants={variants.rect}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M12 3v18"
        variants={variants.divider}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Columns2(props: Columns2Props) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Columns2,
  Columns2 as Columns2Icon,
  type Columns2Props,
  type Columns2Props as Columns2IconProps,
};
