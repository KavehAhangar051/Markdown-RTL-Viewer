/**
 * @file utils/cFamilyEnhancer.ts
 * @description Single-responsibility semantic HTML token enhancer for C-family and systems languages.
 * Enriches highlight.js output with VSCode-level function call, member property, constant, and type spans.
 */

/** Languages that benefit from VSCode-style semantic token enhancement */
const SYSTEMS_LANGUAGES = new Set([
  'c',
  'cpp',
  'csharp',
  'java',
  'go',
  'rust',
  'kotlin',
  'swift',
  'dart',
]);

/** Standard uppercase C/POSIX type identifiers */
const C_UPPER_TYPES = new Set(['FILE', 'DIR', 'BOOL', 'DWORD', 'HANDLE', 'LPSTR', 'LPCSTR']);

/**
 * Combined single-pass token matcher for unhighlighted text segments in C-family languages:
 * - Group 1, 2, 3: Member method call (`ptr->method(` or `obj.method(`)
 * - Group 4, 5, 6: Struct/pointer property access (`ptr->field` or `obj.field`)
 * - Group 7: Standalone function invocation (`func(`)
 * - Group 8: All-caps macro/enum constant (`MAX_BUFFER`, `EXIT_SUCCESS`)
 * - Group 9: PascalCase or `*_t` type identifier (`PacketNode_t`, `size_t`)
 */
const C_TOKEN_ENHANCE_REGEX =
  /(-&gt;|\.)(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()|(-&gt;|\.)(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\b|\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()|\b([A-Z][A-Z0-9_]+)\b|\b([A-Z][a-zA-Z0-9_]*|[a-zA-Z_][a-zA-Z0-9_]*_t)\b/g;

/**
 * Enriches highlight.js HTML output with VSCode-level semantic spans for C/C++ and systems languages.
 * Safely skips comments, strings, and preprocessor directives.
 *
 * @param {string} html - Highlighted HTML string from highlight.js.
 * @param {string} language - Normalized language identifier.
 * @returns {string} Enhanced HTML string with additional semantic spans.
 */
export function enhanceHighlightedHtml(html: string, language: string): string {
  if (!html || !SYSTEMS_LANGUAGES.has(language)) {
    return html;
  }

  const parts = html.split(/(<[^>]+>)/g);
  const spanStack: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part) continue;

    if (part.startsWith('<')) {
      if (part.startsWith('<span')) {
        const classMatch = /class="([^"]+)"/.exec(part);

        spanStack.push(classMatch?.[1] ?? '');
      } else if (part.startsWith('</span')) {
        spanStack.pop();
      }

      continue;
    }

    const activeClass = spanStack[spanStack.length - 1];

    // Only enhance top-level code text or function parameter lists
    if (spanStack.length > 0 && activeClass !== 'hljs-params') {
      continue;
    }

    parts[i] = part.replace(
      C_TOKEN_ENHANCE_REGEX,
      (
        match,
        mCallOp?: string,
        mCallSpace?: string,
        mCallName?: string,
        mPropOp?: string,
        mPropSpace?: string,
        mPropName?: string,
        fnCall?: string,
        upperConst?: string,
        customType?: string
      ) => {
        if (mCallOp && mCallName) {
          return `${mCallOp}${mCallSpace ?? ''}<span class="hljs-title function_ invoke_">${mCallName}</span>`;
        }

        if (mPropOp && mPropName) {
          return `${mPropOp}${mPropSpace ?? ''}<span class="hljs-property">${mPropName}</span>`;
        }

        if (fnCall) {
          return `<span class="hljs-title function_ invoke_">${fnCall}</span>`;
        }

        if (upperConst) {
          const spanClass = C_UPPER_TYPES.has(upperConst)
            ? 'hljs-type'
            : 'hljs-variable constant_';

          return `<span class="${spanClass}">${upperConst}</span>`;
        }

        if (customType) {
          return `<span class="hljs-type">${customType}</span>`;
        }

        return match;
      }
    );
  }

  return parts.join('');
}
