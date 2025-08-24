import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, describe, it } from 'vitest';

import { proceed } from '@/if.js';

const INDEX_JS_PATH = join(import.meta.dirname, 'mock', 'src', 'index.js');
const INDEX_JS = readFileSync(INDEX_JS_PATH, 'utf-8');

describe('acorn use', () => {
  it('should parse comments', () => {
    proceed(INDEX_JS, { variables: {}, ecmaVersion: 'latest', sourceType: 'module' });
  });
});
