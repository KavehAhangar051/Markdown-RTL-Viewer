/**
 * @file utils/deviceDetector.ts
 * @description Device capability detection utility to identify desktop and laptop environments.
 */

/**
 * Checks if the current client environment has low processing or memory capabilities.
 * Detects devices with 4 or fewer CPU threads, 4GB or less RAM, or reduced-motion preferences.
 *
 * @returns {boolean} True if the client is running on a low-end or resource-constrained device.
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check hardware concurrency (<= 4 cores indicates entry-level or constrained hardware)
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }

  // Check device memory (<= 4GB indicates low-memory device)
  const nav = navigator as unknown as { deviceMemory?: number };
  if (nav && typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) {
    return true;
  }

  // Check prefers-reduced-motion accessibility flag
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  return false;
}

/**
 * Checks if the current client environment matches a desktop or laptop profile.
 * Evaluates viewport dimension (>= 1024px), fine mouse/trackpad pointer capabilities,
 * and user motion accessibility preferences.
 *
 * @returns {boolean} True if the client is running on a desktop or laptop device with fine pointer; false otherwise.
 */
export function isDesktopOrLaptop(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const isWideScreen = window.innerWidth >= 1024;
  const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return isWideScreen && hasFinePointer && !prefersReducedMotion;
}
