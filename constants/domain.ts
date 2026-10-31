/**
 * @file constants/domain.ts
 * @description Centralized domain constants for markdown processing, editor configuration, and UI timings.
 */

/**
 * Default average reading speed for Persian/Arabic text in words per minute (WPM).
 */
export const DEFAULT_READING_SPEED_WPM = 180;

/**
 * Maximum supported file size in bytes for direct markdown uploads (5MB).
 */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Supported file extensions for markdown/plain-text uploads.
 */
export const SUPPORTED_UPLOAD_EXTENSIONS = ['.md', '.txt'] as const;

/**
 * HTML input accept attribute string derived from SUPPORTED_UPLOAD_EXTENSIONS.
 */
export const UPLOAD_ACCEPT_ATTR = SUPPORTED_UPLOAD_EXTENSIONS.join(',');

/**
 * Toast notification auto-dismiss duration in milliseconds.
 */
export const TOAST_DISMISS_DURATION_MS = 4500;

/**
 * Clipboard action state visual reset duration in milliseconds.
 */
export const CLIPBOARD_RESET_DURATION_MS = 2000;
