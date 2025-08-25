import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, describe, it } from 'vitest';

import { proceed } from '@/compiler/if.js';
import { mockContext } from './mock-context.js';

const JS_PATH = join(import.meta.dirname, '..', 'mock', 'src', 'sample.js');
const JS = readFileSync(JS_PATH, 'utf-8');

describe('acorn use', () => {
  it('should parse comments', () => {
    const ctx = mockContext(JS, JS_PATH, {
      variables: {
        DEBUG: false,
        PARENT: 1,
        CHILD: 0,
      },
    });
    expect(proceed(ctx)).toBeTypeOf('string');
  });
});
