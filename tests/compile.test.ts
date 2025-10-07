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
    expect(result).not.toContain("console.log('1');");
    expect(result).not.toContain("console.log('2');");
    expect(result).not.toContain("console.log('3');");
    expect(result).not.toContain("console.log('4');");
    expect(result).not.toContain('#if'); // directive comments removed
    expect(result).not.toContain('#endif'); // directive comments removed
    expect(result).toContain("console.log('5');");
    expect(result).toContain("console.log('6');");
    expect(result).toContain("console.log('7');");
  });
});
