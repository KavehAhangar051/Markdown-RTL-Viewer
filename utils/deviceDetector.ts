/**
 * @file utils/deviceDetector.ts
 * @description Device capability and frame-pacing detection utility for Google Chrome and web browsers.
 * Identifies genuinely constrained hardware (<= 2 CPU cores, <= 2GB RAM, Data Saver, or software WebGL rasterizer)
 * without false-positives on dual-GPU desktops or initial hydration frames.
 */

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
 * Inspects the WebGL unmasked renderer string once (using `high-performance` preference so dual-GPU
 * desktops report their primary GPU) to detect software rasterizers (`SwiftShader`, `llvmpipe`,
 * `Basic Render Driver`).
 *
 * @returns {boolean} True when a software or severely constrained GPU renderer is detected.
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
      canvas.getContext('webgl', { powerPreference: 'high-performance' }) ||
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
      lower.includes('mali-4') ||
      lower.includes('adreno (tm) 3');

    cachedGpuLowEnd = isWeakRenderer;

    return isWeakRenderer;
  } catch {
    cachedGpuLowEnd = false;

    return false;
  }
}

/**
 * Checks if the current client environment has genuinely low processing, memory, or GPU capabilities.
 * Avoids false-positives on modern 4+ core / dual-GPU systems.
 *
 * @returns {boolean} True if the client is running on a genuinely resource-constrained device.
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (runtimeFpsLowEnd) {
    return true;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency &&
    navigator.hardwareConcurrency <= 2
  ) {
    return true;
  }

  // SAFETY: Navigator in modern Chromium browsers optionally provides deviceMemory and connection
  const nav = navigator as NavigatorExtended;

  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) {
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
 * Waits until initial page hydration and entrance animations settle (2500ms after load),
 * then monitors frame pacing over 60 frames and triggers `onLowEndDetected` only if
 * sustained frame rate drops below ~30 FPS (>50% of frames taking >34ms).
 *
 * @param {() => void} onLowEndDetected - Callback invoked when sustained severe frame drops are detected.
 * @returns {() => void} Cleanup function to cancel monitoring.
 */
export function monitorFramePacingForLowEnd(onLowEndDetected: () => void): () => void {
  if (typeof window === 'undefined' || isLowEndDevice()) {
    return () => {};
  }

  let rafId: number | null = null;
  let sampleCount = 0;
  let slowFrameCount = 0;
  const TARGET_SAMPLES = 60;

  const startSampling = () => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (delta > 4 && delta < 200) {
        sampleCount += 1;

        if (delta > 34) {
          slowFrameCount += 1;
        }
      }

      if (sampleCount >= TARGET_SAMPLES) {
        if (slowFrameCount / sampleCount >= 0.5) {
          runtimeFpsLowEnd = true;
          onLowEndDetected();
        }

        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
  };

  const delayTimer = window.setTimeout(startSampling, 2500);

  return () => {
    window.clearTimeout(delayTimer);

    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
    }
  };
}

/**
 * Checks if the current client environment matches a desktop or laptop profile.
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
