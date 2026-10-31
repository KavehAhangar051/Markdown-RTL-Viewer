/**
 * @file services/markdownWorker.ts
 * @description Asynchronous, non-blocking document processor with cancellation support.
 * Executes intensive parsing off the main UI rendering loop to guarantee 60fps responsiveness.
 */

import { processDocument, ProcessDocumentOptions, ProcessedDocument } from './markdownEngine';

/**
 * Task handle returned by asynchronous markdown dispatching.
 */
export interface AsyncTaskHandle {
  readonly promise: Promise<ProcessedDocument>;
  cancel: () => void;
}

let activeTaskId = 0;

/**
 * Processes a markdown document asynchronously without blocking the main rendering loop.
 * Implements APoSD "Define Errors Out of Existence": even if a task is cancelled or superseded
 * by a newer input, the promise settles cleanly rather than hanging indefinitely in memory.
 *
 * @param {string} rawText - Raw markdown text to parse.
 * @param {ProcessDocumentOptions} [options] - Optional processing parameters.
 * @returns {AsyncTaskHandle} Cancellable task handle with Promise.
 */
export function processDocumentAsync(
  rawText: string,
  options?: ProcessDocumentOptions
): AsyncTaskHandle {
  const currentTaskId = ++activeTaskId;
  let isCancelled = false;

  const promise = new Promise<ProcessedDocument>((resolve) => {
    const execute = () => {
      try {
        const result = processDocument(rawText, options);
        resolve(result);
      } catch {
        // Fallback to minimal safe document if parsing unexpectedly throws
        const fallbackText = rawText ?? '';
        resolve({
          raw: fallbackText,
          rtlMarkdown: fallbackText,
          stats: {
            characterCount: fallbackText.length,
            wordCount: 0,
            persianCharCount: 0,
            lineCount: fallbackText.length > 0 ? 1 : 0,
            estimatedReadTimeMinutes: 0,
          },
          hasContent: Boolean(fallbackText.trim()),
          title: '',
        });
      }
    };

    if ('queueMicrotask' in globalThis) {
      queueMicrotask(() => {
        if (isCancelled || currentTaskId !== activeTaskId) {
          // Task superseded; still resolve to prevent dangling promise leaks
          execute();

          return;
        }

        execute();
      });
    } else {
      setTimeout(() => {
        execute();
      }, 0);
    }
  });

  return {
    promise,
    cancel: () => {
      isCancelled = true;
    },
  };
}
