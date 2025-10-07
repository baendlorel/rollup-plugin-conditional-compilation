import { describe, it, expect } from 'vitest';
import { IfParser } from '@/compiler/parser.js';

describe('IfParser getBlocks and collect', () => {
  it('getBlocks should return two directive blocks for a simple #if / #endif', () => {
    const opts = { variables: { DEBUG: true } } as any;
    const parser = new IfParser(opts);

    const code = `// #if DEBUG
console.log('inside');
// #endif
`;

    const blocks = parser.toDirvBlocks(code);
    expect(blocks).toHaveLength(2);

    const ifBlock = blocks[0];
    const endifBlock = blocks[1];

    expect(ifBlock.dirv).toBe('#if');
    expect(ifBlock.condition).toBe(true);
    expect(typeof ifBlock.start).toBe('number');
    expect(typeof ifBlock.end).toBe('number');

    expect(endifBlock.dirv).toBe('#endif');
    expect(endifBlock.condition).toBeNull();
  });

  it('collect should produce nested IfBlock tree for nested directives', () => {
    const opts = { variables: { OUT: true, IN: true } } as any;
    const parser = new IfParser(opts);

    const code = `// #if OUT
outer();
// #if IN
inner();
// #endif
// #endif
`;

    const dirvBlocks = parser.toDirvBlocks(code);
    // should find four directive comments (if, if, endif, endif)
    expect(dirvBlocks.length).toBe(4);

    const ifBlocks = parser.toIfBlocks(dirvBlocks);
    // one top-level IfBlock
    expect(ifBlocks.length).toBe(1);

    const outer = ifBlocks[0];
    expect(outer.condition).toBe(true);
    expect(Array.isArray(outer.children)).toBe(true);
    expect(outer.children.length).toBe(1);

    const inner = outer.children[0];
    expect(inner.condition).toBe(true);

    // positions: outer.start < inner.start < inner.end < outer.end
    expect(outer.ifStart).toBeLessThan(inner.ifStart);
    expect(inner.ifStart).toBeLessThan(inner.ifEnd);
    expect(inner.endifEnd).toBeLessThan(outer.endifEnd);
  });

  it('collect multiple and nested if blocks correctly', () => {
    const content = loadjs('case5.js');
    const opts = { variables: { A: true, B: false, C: true } } as any;
    const parser = new IfParser(opts);

    const dirvBlocks = parser.toDirvBlocks(content);
    const ifBlocks = parser.toIfBlocks(dirvBlocks);

    expect(dirvBlocks.length).toBe(10);
    expect(dirvBlocks).toMatchObject([
      { dirv: Dirv.If, condition: false },
      { dirv: Dirv.If, condition: true },
      { dirv: Dirv.Endif },
      { dirv: Dirv.If, condition: true },
      { dirv: Dirv.Endif },
      { dirv: Dirv.Endif },
      { dirv: Dirv.If, condition: true },
      { dirv: Dirv.If, condition: true },
      { dirv: Dirv.Endif },
      { dirv: Dirv.Endif },
    ]);

    expect(ifBlocks.length).toBe(2);
    expect(ifBlocks).toMatchObject([
      {
        condition: false,
        children: [
          { condition: true, children: [] },
          { condition: true, children: [] },
        ],
      },
      { condition: true, children: [{ condition: true, children: [] }] },
    ]);
    console.log(ifBlocks);
  });
});
