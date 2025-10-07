import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

import { IfParser } from '../src/compiler/parser.js';

// English comments in code per repo conventions
// These tests exercise evaluate, tryParseToBlock and proceed behavior.

const mockPath = join(process.cwd(), '__mock__');
const read = (name: string) => readFileSync(join(mockPath, name), 'utf-8');

describe('IfParser basic behaviors', () => {
  const opts = { variables: { DEBUG: true, VAL: 7 } } as any;
  const parser = new IfParser(opts);

  it('evaluate should compute expressions using provided variables', () => {
    expect(parser.evaluate('DEBUG')).toBe(true);
    expect(parser.evaluate('VAL > 5')).toBe(true);
    expect(parser.evaluate('!!DEBUG')).toBe(true);
  });

  it('evaluate should throw on invalid expressions (unknown identifiers)', () => {
    expect(() => parser.evaluate('UNKNOWN_VAR + 1')).toThrow();
  });

  it('tryParseToBlock should parse simple "#if" and "#endif" comments', () => {
    const ifBlock = parser.tryParseToBlock('#if DEBUG', 0, 10);
    expect(ifBlock).not.toBeNull();
    expect((ifBlock as any).dirv).toBeDefined();
    expect((ifBlock as any).condition).toBe(true);

    const endifBlock = parser.tryParseToBlock('#endif', 11, 18);
    expect(endifBlock).not.toBeNull();
    expect((endifBlock as any).dirv).toBeDefined();
    expect((endifBlock as any).condition).toBeNull();
  });

  it('tryParseToBlock should tolerate leading stars/spaces (trim behavior)', () => {
    const raw = ' *    #if DEBUG';
    const b = parser.tryParseToBlock(raw, 0, raw.length);
    expect(b).not.toBeNull();
    expect((b as any).condition).toBe(true);
  });

  it('proceed should return null for files without recognized directives', () => {
    const code = read('case3.js');
    expect(() => parser.proceed(code)).not.toThrow();
    const result = parser.proceed(code);
    expect(result).toBeNull();
  });

  it('proceed should run on a file with directives without throwing (basic smoke test)', () => {
    const code = read('case2.js');
    expect(() => parser.proceed(code)).not.toThrow();
  });
});
