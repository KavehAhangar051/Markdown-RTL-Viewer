/**
 * @file utils/deviceDetector.ts
 * @description Device capability and frame-pacing detection utility for Google Chrome and web browsers.
 * Identifies low-end hardware (CPU cores, RAM, Data Saver, weak integrated/software GPU, or <45 FPS frame pacing)
 * to automatically enable Reduced Motion and maintain ~60 FPS rendering.
 */

const LOW_END_SESSION_KEY = 'rtl-studio-low-end-device';

interface NavigatorExtended extends Navigator {
  readonly deviceMemory?: number;
  readonly connection?: {
    readonly saveData?: boolean;
    readonly effectiveType?: string;
  };
}

let cachedGpuLowEnd: boolean | null = null;
let runtimeFpsLowEnd = false;

/**
 * Inspects the WebGL unmasked renderer string once to detect software rasterizers
 * (SwiftShader, llvmpipe, Basic Render Driver) or entry-level integrated GPUs that struggle
 * with heavy multi-pass `backdrop-filter: blur()` at 60 FPS.
 *
 * @returns {boolean} True when a constrained or software GPU renderer is detected.
 */
function isConstrainedGpuRenderer(): boolean {
  if (cachedGpuLowEnd !== null) {
    return cachedGpuLowEnd;
  }

  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');

    const gl =
      canvas.getContext('webgl', { powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl');

    if (!gl || !('getParameter' in gl)) {
      cachedGpuLowEnd = true;

      return true;
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
      : String(gl.getParameter(gl.RENDERER) ?? '');

    const lower = renderer.toLowerCase();

    const isWeakRenderer =
      lower.includes('swiftshader') ||
      lower.includes('llvmpipe') ||
      lower.includes('basic render driver') ||
      lower.includes('software') ||
      lower.includes('intel(r) hd graphics') ||
      lower.includes('intel(r) uhd graphics 60') ||
      lower.includes('intel(r) uhd graphics 61') ||
      lower.includes('intel(r) uhd graphics 62') ||
      lower.includes('mali-4') ||
      lower.includes('adreno (tm) 3') ||
      lower.includes('adreno (tm) 4') ||
      lower.includes('adreno (tm) 5');

    cachedGpuLowEnd = isWeakRenderer;

    return isWeakRenderer;
  } catch {
    cachedGpuLowEnd = false;

    return false;
  }
}

/**
 * Checks if the current client environment has low processing, memory, or GPU capabilities.
 * Detects devices with <= 4 CPU threads, <= 4GB RAM, Chrome Data Saver, weak/software GPUs,
 * runtime FPS drops, or OS reduced-motion preferences.
 *
 * @returns {boolean} True if the client is running on a low-end or resource-constrained device.
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (runtimeFpsLowEnd) {
    return true;
  }

  try {
    if (window.sessionStorage.getItem(LOW_END_SESSION_KEY) === '1') {
      runtimeFpsLowEnd = true;

      return true;
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }

  // Check prefers-reduced-motion accessibility flag
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  // Check hardware concurrency (<= 4 cores indicates entry-level or constrained hardware)
  if (
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency &&
    navigator.hardwareConcurrency <= 4
  ) {
    return true;
  }

  // SAFETY: Navigator in modern Chromium browsers optionally provides deviceMemory and connection
  const nav = navigator as NavigatorExtended;

  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) {
    return true;
  }

  if (nav.connection?.saveData === true) {
    return true;
  }

  if (isConstrainedGpuRenderer()) {
    return true;
  }

  return false;
}

/**
 * Monitors real-time frame pacing over a short sample window and triggers `onLowEndDetected`
 * if the browser's frame rate drops below ~45 FPS (average frame delta > 22.5ms), persisting
 * the result in `sessionStorage` so subsequent renders stay locked near 60 FPS.
 *
 * @param {() => void} onLowEndDetected - Callback invoked when sustained frame drops are detected.
 * @returns {() => void} Cleanup function to cancel monitoring.
 */
export function monitorFramePacingForLowEnd(onLowEndDetected: () => void): () => void {
  if (typeof window === 'undefined' || isLowEndDevice()) {
    return () => {};
  }

  let rafId: number | null = null;
  let lastTime = performance.now();
  let sampleCount = 0;
  let slowFrameCount = 0;
  const TARGET_SAMPLES = 45;

  const tick = (now: number) => {
    const delta = now - lastTime;
    lastTime = now;

    // Ignore tab-switch spikes (> 250ms)
    if (delta > 4 && delta < 250) {
      sampleCount += 1;

      if (delta > 24) {
        slowFrameCount += 1;
      }
    }

    if (sampleCount >= TARGET_SAMPLES) {
      // If more than 35% of sampled frames took > 24ms (< 41 FPS), enable low-end reduced motion
      if (slowFrameCount / sampleCount >= 0.35) {
        runtimeFpsLowEnd = true;

        try {
          window.sessionStorage.setItem(LOW_END_SESSION_KEY, '1');
        } catch {
          // Ignore storage write errors
        }

        onLowEndDetected();
      }

      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);

  return () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }
  };
}

/**
 * Checks if the current client environment matches a high-capability desktop or laptop profile.
 * Evaluates viewport dimension (>= 1024px), fine mouse/trackpad pointer capabilities,
 * and ensures the device is not a low-end / reduced-motion system.
 *
 * @returns {boolean} True if the client is running on a capable desktop or laptop device; false otherwise.
 */
export function isDesktopOrLaptop(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const isWideScreen = window.innerWidth >= 1024;
  const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

  return isWideScreen && hasFinePointer && !isLowEndDevice();
}
