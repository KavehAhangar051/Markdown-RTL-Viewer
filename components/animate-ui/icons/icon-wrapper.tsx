'use client';

/**
 * @file components/animate-ui/icons/icon-wrapper.tsx
 * @description Shared Animate UI icon wrapper providing default 24px Lucide sizing, interactive ancestor hover/tap detection, and full AnimateIcon compatibility.
 */

import * as React from 'react';
import {
  AnimateIcon,
  IconWrapper,
  useAnimateIconContext,
  type IconWrapperProps,
} from '@animate-ui/react/icons';

export { AnimateIcon };

const INTERACTIVE_ANCESTOR_SELECTOR =
  'button, a, [role="button"], label, [data-icon-trigger], .group';

/**
 * Wraps an Animate UI Lucide icon component.
 * - Inherits parent `<AnimateIcon>` triggers when nested inside an explicit `<AnimateIcon>`.
 * - Automatically binds hover/tap triggers to the closest interactive ancestor (`button`, `a`, `label`, `.group`)
 *   so hovering anywhere on a button, dock item, badge, or card animates its icon.
 * - Avoids mounting animation controllers until interaction or explicit `animate` trigger so initial render is zero-overhead.
 *
 * @param props - Standard Animate UI IconWrapperProps.
 * @returns Wrapped animated SVG icon element.
 */
export function SmartIconWrapper<T extends string>({
  size = 24,
  animate,
  animateOnHover,
  animateOnTap,
  animateOnView,
  ...rest
}: IconWrapperProps<T>): React.JSX.Element {
  const { controls } = useAnimateIconContext();
  const [hoveredOrTapped, setHoveredOrTapped] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const hasExplicitTrigger =
    controls !== undefined ||
    animate !== undefined ||
    animateOnView !== undefined ||
    animateOnHover === false;

  React.useEffect(() => {
    if (hasExplicitTrigger) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const target = svgEl.closest(INTERACTIVE_ANCESTOR_SELECTOR) ?? svgEl;

    const onEnter = (e: Event) => {
      if ((e as PointerEvent).pointerType !== 'touch') {
        setHasInteracted(true);
        setHoveredOrTapped(true);
      }
    };
    const onLeave = () => setHoveredOrTapped(false);
    const onDown = () => {
      setHasInteracted(true);
      setHoveredOrTapped(true);
    };
    const onUp = () => setHoveredOrTapped(false);

    target.addEventListener('pointerenter', onEnter, { passive: true });
    target.addEventListener('pointerleave', onLeave, { passive: true });
    target.addEventListener('pointerdown', onDown, { passive: true });
    target.addEventListener('pointerup', onUp, { passive: true });
    target.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      target.removeEventListener('pointerenter', onEnter);
      target.removeEventListener('pointerleave', onLeave);
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
    };
  }, [hasExplicitTrigger]);

  const hoverAnim =
    typeof animateOnHover === 'string' ? animateOnHover : true;

  const resolvedAnimate =
    animate !== undefined
      ? animate
      : !hasExplicitTrigger && hasInteracted
        ? hoveredOrTapped
          ? hoverAnim
          : false
        : undefined;

  const wrapperProps: IconWrapperProps<T> & { ref?: React.Ref<SVGSVGElement> } = {
    ...rest,
    ref: svgRef,
    size,
    animate: resolvedAnimate,
    animateOnHover: hasExplicitTrigger ? animateOnHover : undefined,
    animateOnTap: hasExplicitTrigger ? animateOnTap : undefined,
    animateOnView,
  };

  return <IconWrapper {...wrapperProps} />;
}
