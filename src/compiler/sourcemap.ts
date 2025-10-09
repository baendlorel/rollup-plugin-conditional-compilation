import type { ExistingRawSourceMap } from 'rollup';

/**
 * Generate sourcemap for conditional compilation
 * When code blocks are removed, we need to maintain correct line/column mappings
 */
export class SourceMapBuilder {
  private filename: string;
  private mappings: LineMapping[] = [];

  constructor(options: SourceMapOptions = {}) {
    this.filename = options.filename || 'source.js';
  }

  /**
   * Build sourcemap based on kept code ranges
   * @param originalCode The original source code
   * @param keptRanges Array of [start, end] positions that are kept in the output
   * @returns Generated sourcemap in Rollup format
   */
  build(originalCode: string, keptRanges: CodeRange[]): ExistingRawSourceMap {
    let generatedLine = 1;
    let generatedColumn = 0;
    this.mappings = [];

    for (const range of keptRanges) {
      const chunk = originalCode.slice(range.start, range.end);

      // Map each line in the kept chunk
      let currentOffset = range.start;
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];
        const originalPos = this.getLineColumn(originalCode, currentOffset);

        // Add mapping at the start of each line
        if (generatedColumn === 0) {
          this.mappings.push({
            originalLine: originalPos.line,
            originalColumn: originalPos.column,
            generatedLine: generatedLine,
            generatedColumn: 0,
          });
        }

        if (char === '\n') {
          generatedLine++;
          generatedColumn = 0;
        } else {
          generatedColumn++;
        }
        currentOffset++;
      }
    }

    return this.toSourceMap(originalCode);
  }

  /**
   * Convert mappings to sourcemap format
   */
  private toSourceMap(originalCode: string): ExistingRawSourceMap {
    const mappingsString = this.encodeMappings();

    return {
      version: 3,
      file: this.filename,
      sources: [this.filename],
      sourcesContent: [originalCode],
      names: [],
      mappings: mappingsString,
    };
  }

  /**
   * Encode mappings to VLQ format (simplified version)
   * For each line: use semicolons to separate lines, commas for segments
   */
  private encodeMappings(): string {
    if (this.mappings.length === 0) return '';

    const lines: string[] = [];
    let prevGeneratedLine = 1;
    let prevOriginalLine = 1;
    let prevOriginalColumn = 0;

    for (const mapping of this.mappings) {
      // Fill empty lines with semicolons
      while (prevGeneratedLine < mapping.generatedLine) {
        lines.push('');
        prevGeneratedLine++;
      }

      // Calculate deltas
      const generatedColumnDelta = mapping.generatedColumn;
      const sourceIndexDelta = 0; // Always 0 since we have only one source
      const originalLineDelta = mapping.originalLine - prevOriginalLine;
      const originalColumnDelta = mapping.originalColumn - prevOriginalColumn;

      // Simple encoding: AAAA format (generated column, source index, original line, original column)
      const segment = this.encodeSegment([
        generatedColumnDelta,
        sourceIndexDelta,
        originalLineDelta,
        originalColumnDelta,
      ]);

      if (!lines[mapping.generatedLine - 1]) {
        lines[mapping.generatedLine - 1] = segment;
      } else {
        lines[mapping.generatedLine - 1] += ',' + segment;
      }

      prevOriginalLine = mapping.originalLine;
      prevOriginalColumn = mapping.originalColumn;
    }

    return lines.join(';');
  }

  /**
   * Encode a segment to VLQ base64
   * Simplified VLQ encoding for sourcemap
   */
  private encodeSegment(values: number[]): string {
    return values.map((value) => this.encodeVLQ(value)).join('');
  }

  /**
   * Encode a single value to VLQ base64
   */
  private encodeVLQ(value: number): string {
    const VLQ_BASE_SHIFT = 5;
    const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    const VLQ_BASE_MASK = VLQ_BASE - 1;
    const VLQ_CONTINUATION_BIT = VLQ_BASE;
    const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    let encoded = '';
    let vlq = value < 0 ? (-value << 1) + 1 : value << 1;

    do {
      let digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += BASE64_CHARS[digit];
    } while (vlq > 0);

    return encoded;
  }

  /**
   * Convert byte offset to line/column position
   * @param code Source code
   * @param offset Byte offset
   * @returns Line and column (1-indexed for line, 0-indexed for column)
   */
  private getLineColumn(code: string, offset: number): { line: number; column: number } {
    let line = 1;
    let column = 0;

    for (let i = 0; i < offset && i < code.length; i++) {
      if (code[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
    }

    return { line, column };
  }
}

/**
 * Create a sourcemap for conditional compilation result
 * @param originalCode Original source code
 * @param keptRanges Ranges of code that are kept
 * @param options Sourcemap options
 */
export function createSourceMap(
  originalCode: string,
  keptRanges: CodeRange[],
  options: SourceMapOptions = {}
): ExistingRawSourceMap {
  const builder = new SourceMapBuilder(options);
  return builder.build(originalCode, keptRanges);
}
