'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type MonitorProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    screen: {
      initial: { y: 0 },
      animate: {
        y: [0, -1.5, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      },
    },
    stand: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: MonitorProps) {
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
        width="20"
        height="14"
        x="2"
        y="3"
        rx="2"
        variants={variants.screen}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1="8"
        x2="16"
        y1="21"
        y2="21"
        variants={variants.stand}
        initial="initial"
        animate={controls}
      />
      <motion.line
        x1="12"
        x2="12"
        y1="17"
        y2="21"
        variants={variants.stand}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Monitor(props: MonitorProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Monitor,
  Monitor as MonitorIcon,
  type MonitorProps,
  type MonitorProps as MonitorIconProps,
};
