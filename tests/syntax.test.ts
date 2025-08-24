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
    CONDITION: false,
    INVALID_EXPRESSION: 1,
  },
});
const read = (name: string) => readFileSync(join(SYNTAX_PATH, name), 'utf-8');

describe('syntax error', () => {
  it('Case 1: Missing endif', () => {
    proceed(ctx, read('case1.js'));
  });
});
