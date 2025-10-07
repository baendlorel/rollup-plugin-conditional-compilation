import { describe, it, expect } from 'vitest';
import { IfParser } from '@/compiler/parser.js';

describe('IfParser final compile', () => {
  it('evaluate should compute expressions using provided variables', () => {
    const code = loadjs('case5.js');
    const opts = { variables: { A: true, B: false, C: true } } as any;
    const parser = new IfParser(opts);

    const dirvBlocks = parser.toDirvBlocks(code);
    const ifBlocks = parser.toIfBlocks(dirvBlocks);
    const result = parser.compile(code, ifBlocks);
    console.log(result);
  });
});
