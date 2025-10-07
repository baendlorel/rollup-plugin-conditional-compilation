import { describe, it, expect } from 'vitest';
import { IfParser } from '@/compiler/parser.js';

describe('IfParser final compile', () => {
  it('evaluate should compute expressions using provided variables', () => {
    const code = loadjs('case5.js');
    const opts = { variables: { A: true, B: false, C: true } };
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

  it('complex case6 should ignore block-commented directives and handle nested indented directives', () => {
    const code = loadjs('case6.js');
    const opts = { variables: { A: true, B: true, C: false } };
    const parser = new IfParser(opts);

    const dirvBlocks = parser.toDirvBlocks(code);
    // should ignore directives inside block comments and string literals
    // case6 contains 4 visible directive comments (two outer indented #if, inner #if/#endif)
    expect(dirvBlocks.length).toBe(4);

    const ifBlocks = parser.toIfBlocks(dirvBlocks);
    const result = parser.compile(code, ifBlocks);

    // since A is true and B is true in opts, inner code should remain
    expect(result).toContain("console.log('A-start');".replace(/'/g, "'"));
    expect(result).toContain("console.log('B-inner');");
    expect(result).toContain("console.log('A-end');");
    // ensure the block-commented 'inside block comment' is still present because it was in block comment
    expect(result).toContain('inside block comment');
  });

  it('case7 should handle numeric expressions and adjacent directives properly', () => {
    const code = loadjs('case7.js');
    // X falsy, Y true, Z true to exercise various branches
    const opts = { variables: { X: 0, Y: true, Z: true } };
    const parser = new IfParser(opts);

    const dirvBlocks = parser.toDirvBlocks(code);
    expect(dirvBlocks.length).toBeGreaterThanOrEqual(6);

    const ifBlocks = parser.toIfBlocks(dirvBlocks);
    const result = parser.compile(code, ifBlocks);

    // X is falsy -> x-true should be removed; numeric -1 is truthy -> 'neg' should exist
    expect(result).not.toContain('x-true');
    expect(result).toContain('y-and-z');
    expect(result).toContain('neg');
  });

  it('case8 malformed expr cause evaluate to throw', () => {
    const code = loadjs('case8.js');
    const opts = { variables: { D: true, A: true } } as any;
    const parser = new IfParser(opts);

    expect(() => parser.toDirvBlocks(code)).toThrow();
  });

  it('case9 handle else', () => {
    const code = loadjs('case9.js');
    const parser1 = new IfParser({ variables: { A: true } });
    const result1 = parser1.proceed(code);
    expect(result1).toContain("console.log('1');");

    const parser2 = new IfParser({ variables: { A: false } });
    const result2 = parser2.proceed(code);
    expect(result2).toContain("console.log('2');");
  });
});
