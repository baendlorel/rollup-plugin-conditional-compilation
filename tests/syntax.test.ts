import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, describe, it } from 'vitest';

import { proceed } from '@/compiler/if.js';
import { mockContext } from './mock-context.js';

const SYNTAX_PATH = join(import.meta.dirname, '..', 'mock', 'src', 'syntax');
const ctx = mockContext({
  variables: {
    ERROR_CASE_1: false,
    ERROR_CASE_2: false,
    ERROR_CASE_3: false,
    ERROR_CASE_4: false,
    ERROR_CASE_5: false,
    ERROR_CASE_6: false,
    ERROR_CASE_7: false,
    ERROR_CASE_8: false,
    ERROR_CASE_9: false,
    ERROR_CASE_10: false,
    ERROR_CASE_11: false,
    ERROR_CASE_12: false,
    ERROR_CASE_13: false,
    INNER: true,
    OUTER: true,
    TEST: true,
    ANOTHER: true,
    A: true,
    B: true,
    EMPTY: true,
    CONDITION: false,
    INVALID_EXPRESSION: 1,
  },
});
const read = (name: string) => readFileSync(join(SYNTAX_PATH, name), 'utf-8');

describe('syntax error', () => {
  it('Case 1: Missing endif', () => {
    expect(() => proceed(ctx, read('case1.js'))).toThrow(`'#endif' is missing`);
  });

  it('Case 2: Multiple else', () => {
    expect(() => proceed(ctx, read('case2.js'))).toThrow(`Multiple '#else' in the same 'if'`);
  });

  it('Case 3: elif after else', () => {
    expect(() => proceed(ctx, read('case3.js'))).toThrow(`'#elif' cannot appear after '#else'`);
  });

  it('Case 4: Orphaned endif', () => {
    expect(() => proceed(ctx, read('case4.js'))).toThrow(
      `Must have at least 2 directives, got orphaned '#endif'`
    );
  });

  it('Case 5: Orphaned else', () => {
    expect(() => proceed(ctx, read('case5.js'))).toThrow(
      `Must have at least 2 directives, got orphaned '#else'`
    );
  });

  it('Case 6: Orphaned elif', () => {
    expect(() => proceed(ctx, read('case6.js'))).toThrow(
      `Must have at least 2 directives, got orphaned '#elif'`
    );
  });

  it('Case 7: else with expression', () => {
    expect(() => proceed(ctx, read('case7.js'))).toThrow(
      `'#else' should not have any expression, but got: "INVALID_EXPRESSION"`
    );
  });

  it('Case 8: endif with expression', () => {
    expect(() => proceed(ctx, read('case8.js'))).toThrow(
      `'#endif' should not have any expression, but got: "INVALID_EXPRESSION"`
    );
  });

  it('Case 9: Nested if block missing endif', () => {
    expect(() => proceed(ctx, read('case9.js'))).toThrow("'#endif' is missing");
  });

  it('Case 10: elif after else (with expression)', () => {
    expect(() => proceed(ctx, read('case10.js'))).toThrow("'#elif' cannot appear after '#else'");
  });

  it('Case 11: Multiple nested else in one block', () => {
    expect(() => proceed(ctx, read('case11.js'))).toThrow("Multiple '#else' in the same 'if'");
  });

  it('Case 12: if block with only endif', () => {
    expect(() => proceed(ctx, read('case12.js'))).toThrow('Must have at least 2 directives');
  });

  it('Case 13: else before any if', () => {
    expect(() => proceed(ctx, read('case13.js'))).toThrow(
      "Must have at least 2 directives, got orphaned '#else'"
    );
  });
});
