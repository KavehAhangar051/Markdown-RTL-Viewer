'use client';

import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  getVariants,
  useAnimateIconContext,
  type IconProps,
} from '@animate-ui/react/icons';
import { SmartIconWrapper } from './icon-wrapper';

type CpuProps = IconProps<keyof typeof animations>;

const animations = {
  default: {
    outer: {},
    core: {
      initial: { scale: 1 },
      animate: {
        scale: [1, 0.85, 1.08, 1],
        transformOrigin: '12px 12px',
        transition: { duration: 0.55, ease: 'easeInOut' },
      },
    },
    pins: {
      initial: { opacity: 1 },
      animate: {
        opacity: [1, 0.35, 1],
        transition: { duration: 0.5, ease: 'easeInOut' },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size, ...props }: CpuProps) {
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
      <motion.g variants={variants.pins} initial="initial" animate={controls}>
        <path d="M12 20v2" />
        <path d="M12 2v2" />
        <path d="M17 20v2" />
        <path d="M17 2v2" />
        <path d="M2 12h2" />
        <path d="M2 17h2" />
        <path d="M2 7h2" />
        <path d="M20 12h2" />
        <path d="M20 17h2" />
        <path d="M20 7h2" />
        <path d="M7 20v2" />
        <path d="M7 2v2" />
      </motion.g>
      <motion.rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        variants={variants.outer}
        initial="initial"
        animate={controls}
      />
      <motion.rect
        x="8"
        y="8"
        width="8"
        height="8"
        rx="1"
        variants={variants.core}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function Cpu(props: CpuProps) {
  return <SmartIconWrapper icon={IconComponent} {...props} />;
}

export {
  animations,
  Cpu,
  Cpu as CpuIcon,
  type CpuProps,
  type CpuProps as CpuIconProps,
};
