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

  it('complex case6 should ignore block-commented directives and handle nested indented directives', () => {
    const code = loadjs('case6.js');
    const opts = { variables: { A: true, B: true, C: false } } as any;
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
    const opts = { variables: { X: 0, Y: true, Z: true } } as any;
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

  it('case8 should be resilient: malformed expressions cause evaluate to throw, inline comments ignored', () => {
    const code = loadjs('case8.js');
    const opts = { variables: { D: true, A: true } } as any;
    const parser = new IfParser(opts);

    const dirvBlocks = parser.toDirvBlocks(code);

    // there are 3 real directive lines (#if malformed, #if D, #endif)
    expect(dirvBlocks.length).toBeGreaterThanOrEqual(2);

    // the malformed condition should cause evaluate to throw when parsing that specific block
    // find the malformed block text by scanning raw code for '(A && )' pattern location
    const hasMalformed = code.indexOf('(A && )') !== -1;
    if (hasMalformed) {
      // we expect evaluate to throw for malformed expression when tryParseToBlock is run
      expect(() => parser.toDirvBlocks(code)).toThrow();
    }

    // inline comment with '#if' after code should not be seen as directive; real D block should exist
    // if parser didn't throw, ensure that 'keep-me' remains and 'd-true' is kept when D=true
    if (!hasMalformed) {
      const ifBlocks = parser.toIfBlocks(dirvBlocks);
      const result = parser.compile(code, ifBlocks);
      expect(result).toContain('keep-me');
      expect(result).toContain('d-true');
    }
  });
});
