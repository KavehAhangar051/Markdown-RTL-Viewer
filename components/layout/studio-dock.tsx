'use client';

/**
 * @file components/layout/studio-dock.tsx
 * @description Floating studio quick-action dock providing fluid access to tools, paste, download, and view modes.
 */

import React from 'react';
import { m, useReducedMotion } from 'motion/react';
import { MagnificationDock } from '@/components/ui/magnification-dock';
import { useStudioDockActions } from '@/hooks/useStudioDockActions';
import { DURATION, EASE_OUT } from '@/lib/ease';

/**
 * Floating studio dock offering quick access to RTL Markdown tools, paste, download, and view modes.
 */
export function StudioDock(): React.JSX.Element {
  const dockItems = useStudioDockActions();
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      id="studio-floating-dock-container"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: 12,
              scale: 0.96,
              transition: {
                duration: DURATION.slow * DURATION.exitRatio,
                ease: EASE_OUT,
              },
            }
      }
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto z-40 flex justify-center pointer-events-none px-4"
    >
      <div className="pointer-events-auto">
        <MagnificationDock
          items={dockItems}
          panelHeight={58}
          baseItemSize={42}
          magnification={60}
          distance={140}
        />
      </div>
    </m.div>
  );
}

