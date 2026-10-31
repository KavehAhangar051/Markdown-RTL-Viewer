/**
 * @file utils/rtlConverter.ts
 * @description Core RTL Markdown processor. Transforms standard Markdown into RTL-optimized Markdown.
 */

/**
 * Transforms standard Markdown text into an RTL-aligned Markdown structure.
 * 
 * @param markdown - Raw Markdown string input.
 * @returns Transformed RTL Markdown string.
 */
export function convertToRtlMarkdown(markdown: string): string {
  if (!markdown) return '';

  // Ensure table columns are right-aligned if they lack explicit alignment
  return alignMarkdownTablesRtl(markdown);
}

/** Pre-compiled static regexes to avoid re-compilation in hot processing passes */
const CODE_FENCE_REGEX = /^\s*(```|~~~)/;
const MATH_BLOCK_REGEX = /^\s*\$\$/;
const TABLE_DIVIDER_REGEX = /^\s*\|?(\s*:?-+:?\s*\|)+\s*$/;
const ALIGN_REPLACE_REGEX = /:?-+:?/g;

/**
 * Ensures Markdown tables align text to the right by modifying header separator rows.
 * Fenced code blocks and math blocks are preserved intact without modifying their inner content.
 * 
 * @param {string} md - Raw markdown text.
 * @returns {string} Processed markdown text with RTL-aligned tables.
 */
function alignMarkdownTablesRtl(md: string): string {
  // Quick character guard: skip line splitting if text contains no table delimiters
  if (!md.includes('|') || !md.includes('-')) {
    return md;
  }

  const lines = md.split('\n');
  const lineCount = lines.length;
  let inCodeBlock = false;
  let inMathBlock = false;
  let hasModified = false;

  for (let i = 0; i < lineCount; i++) {
    const line = lines[i];

    // Check if toggling fenced code blocks (``` or ~~~)
    if (CODE_FENCE_REGEX.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Never modify lines inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Check if toggling math block ($$) without regex match allocation
    if (MATH_BLOCK_REGEX.test(line)) {
      let matchCount = 0;
      let pos = line.indexOf('$$');

      while (pos !== -1) {
        matchCount++;
        pos = line.indexOf('$$', pos + 2);
      }

      if (matchCount % 2 !== 0) {
        inMathBlock = !inMathBlock;
        continue;
      }
    }

    // Never modify lines inside math blocks
    if (inMathBlock) {
      continue;
    }

    // Check if line is a table header divider only when both '|' and '-' are present
    if (line.includes('|') && line.includes('-') && TABLE_DIVIDER_REGEX.test(line)) {
      lines[i] = line.replace(ALIGN_REPLACE_REGEX, '---:'); // Force right-alignment for all columns
      hasModified = true;
    }
  }

  // If no table dividers were altered, return original string directly avoiding rejoining
  return hasModified ? lines.join('\n') : md;
}
