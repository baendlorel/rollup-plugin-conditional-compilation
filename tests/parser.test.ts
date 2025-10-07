import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, describe, it } from 'vitest';

const mockPath = join(process.cwd(), '__mock__');
const read = (name: string) => readFileSync(join(mockPath, name), 'utf-8');

describe('syntax error', () => {});
