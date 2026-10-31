/**
 * @file utils/fileHelpers.ts
 * @description Pure File I/O helper utilities for browser-based file downloading and reading.
 * Implements John Ousterhout's 'Define Errors Out of Existence' principle by safely
 * handling missing environments, empty inputs, and DOM attachment errors internally.
 */

import { MAX_UPLOAD_FILE_SIZE_BYTES, SUPPORTED_UPLOAD_EXTENSIONS } from '@/constants/domain';

/**
 * Validation result status for uploaded Markdown/text files.
 */
export type UploadFileValidationResult = 'valid' | 'invalid_type' | 'file_too_large';

/**
 * Pure contract validator for uploaded Markdown files.
 * Evaluates extension case-insensitively and enforces maximum byte size limit.
 *
 * @param {string} fileName - Candidate file name.
 * @param {number} fileSizeBytes - File size in bytes.
 * @returns {UploadFileValidationResult} Explicit validation status.
 */
export function validateMarkdownUploadFile(
  fileName: string,
  fileSizeBytes: number
): UploadFileValidationResult {
  const normalizedName = (fileName ?? '').trim().toLowerCase();
  const hasValidExt = SUPPORTED_UPLOAD_EXTENSIONS.some((ext) => normalizedName.endsWith(ext));

  if (!hasValidExt) {
    return 'invalid_type';
  }

  if (fileSizeBytes > MAX_UPLOAD_FILE_SIZE_BYTES || fileSizeBytes < 0) {
    return 'file_too_large';
  }

  return 'valid';
}

/**
 * Downloads string content as a downloadable file in the browser environment.
 * Defines errors out of existence: safely no-ops if called outside a DOM browser context,
 * and ensures revoked Object URLs to prevent memory leaks.
 *
 * @param {string} content - File text content to be saved.
 * @param {string} [filename='document.md'] - Target filename for the downloaded file.
 * @param {string} [mimeType='text/markdown;charset=utf-8'] - MIME type format of the file.
 */
export function downloadFile(
  content: string,
  filename = 'document.md',
  mimeType = 'text/markdown;charset=utf-8'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const safeContent = content ?? '';
  const safeFilename = filename && filename.trim() ? filename.trim() : 'document.md';

  try {
    const blob = new Blob([safeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch {
    // Non-fatal fallback for restricted sandbox environments
  }
}

/**
 * Reads plain text content asynchronously from a user-provided File object.
 * Defines errors out of existence: returns empty string rather than rejecting on empty or unreadable files.
 *
 * @param {File | null | undefined} file - The File object selected or dropped by the user.
 * @returns {Promise<string>} A Promise resolving to the file's text content.
 */
export function readTextFile(file?: File | null): Promise<string> {
  if (!file) {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        // SAFETY: readAsText produces a string result upon successful completion
        const result = e.target?.result as string;
        resolve(result || '');
      };

      reader.onerror = () => resolve('');

      reader.readAsText(file);
    } catch {
      resolve('');
    }
  });
}

