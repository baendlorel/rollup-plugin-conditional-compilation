import { describe, it, expect } from 'vitest';
import { IfParser } from '@/compiler/parser.js';

describe('Advanced if/elif/else compilation tests', () => {
  describe('case10: Complex elif chains and nested elif', () => {
    it('should handle multiple elif with first condition true', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: true, B: false, C: false, X: false, Y: false, Z: false },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('a-true');");
      expect(result).not.toContain("console.log('b-true');");
      expect(result).not.toContain("console.log('c-true');");
      expect(result).not.toContain("console.log('all-false');");
      expect(result).not.toContain("console.log('x-start');");
    });

    it('should handle elif when first condition is false', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: false, B: true, C: false, X: false, Y: false, Z: false },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('a-true');");
      expect(result).toContain("console.log('b-true');");
      expect(result).not.toContain("console.log('c-true');");
      expect(result).not.toContain("console.log('all-false');");
    });

    it('should handle third elif condition', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: false, B: false, C: true, X: false, Y: false, Z: false },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('a-true');");
      expect(result).not.toContain("console.log('b-true');");
      expect(result).toContain("console.log('c-true');");
      expect(result).not.toContain("console.log('all-false');");
    });

    it('should handle else when all elif conditions are false', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: false, B: false, C: false, X: false, Y: false, Z: false },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('a-true');");
      expect(result).not.toContain("console.log('b-true');");
      expect(result).not.toContain("console.log('c-true');");
      expect(result).toContain("console.log('all-false');");
    });

    it('should handle nested elif inside if block', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: false, B: false, C: false, X: true, Y: false, Z: true },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('x-start');");
      expect(result).not.toContain("console.log('xy-true');");
      expect(result).toContain("console.log('xz-true');");
      expect(result).not.toContain("console.log('x-but-not-yz');");
      expect(result).toContain("console.log('x-end');");
    });

    it('should handle nested else when all inner conditions are false', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: false, B: false, C: false, X: true, Y: false, Z: false },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('x-start');");
      expect(result).not.toContain("console.log('xy-true');");
      expect(result).not.toContain("console.log('xz-true');");
      expect(result).toContain("console.log('x-but-not-yz');");
      expect(result).toContain("console.log('x-end');");
    });
  });

  describe('case11: Multiple elif chains and deep nesting', () => {
    it('should pick the first true elif in a long chain', () => {
      const code = loadjs('case11.js');
      const parser = new IfParser({
        variables: { LEVEL1: false, LEVEL2: false, LEVEL2_ALT: false, LEVEL3: false },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('never1');");
      expect(result).not.toContain("console.log('never2');");
      expect(result).not.toContain("console.log('never3');");
      expect(result).toContain("console.log('fourth-condition');");
      expect(result).not.toContain("console.log('never4');");
      expect(result).not.toContain("console.log('never5');");
    });

    it('should not execute elif after a true elif', () => {
      const code = loadjs('case11.js').split('//!divider')[0];
      const parser = new IfParser({
        variables: { LEVEL1: false, LEVEL2: false, LEVEL2_ALT: false, LEVEL3: false },
      });
      const result = parser.proceed(code);

      // Fourth condition is true, so fifth elif and else should not execute
      expect(result).toContain("console.log('fourth-condition');");
      expect(result).not.toContain("console.log('never4');");
      expect(result).not.toContain("console.log('never5');");
    });

    it('should handle deep nesting with elif at level 2', () => {
      const code = loadjs('case11.js').split('//!divider')[1];
      const parser = new IfParser({
        variables: { LEVEL1: true, LEVEL2: false, LEVEL2_ALT: true, LEVEL3: true },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('L1-start');");
      expect(result).not.toContain("console.log('L2-start');");
      expect(result).toContain("console.log('L2-alt');");
      expect(result).toContain("console.log('L3-deep');");
      expect(result).not.toContain("console.log('L2-else');");
      expect(result).toContain("console.log('L1-end');");
    });

    it('should handle deep nesting with else branch', () => {
      const code = loadjs('case11.js');
      const parser = new IfParser({
        variables: { LEVEL1: true, LEVEL2: false, LEVEL2_ALT: false, LEVEL3: false },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('L1-start');");
      expect(result).not.toContain("console.log('L2-start');");
      expect(result).not.toContain("console.log('L2-alt');");
      expect(result).toContain("console.log('L2-else');");
      expect(result).toContain("console.log('L1-end');");
    });
  });

  describe('case12: Complex expressions in elif', () => {
    it('should evaluate numeric comparison in if/elif chain - large value', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 15, X: false, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('a-large');");
      expect(result).not.toContain("console.log('a-medium');");
      expect(result).not.toContain("console.log('a-small');");
      expect(result).not.toContain("console.log('a-nonpositive');");
    });

    it('should evaluate numeric comparison in if/elif chain - medium value', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 7, X: false, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('a-large');");
      expect(result).toContain("console.log('a-medium');");
      expect(result).not.toContain("console.log('a-small');");
      expect(result).not.toContain("console.log('a-nonpositive');");
    });

    it('should evaluate numeric comparison in if/elif chain - small value', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 3, X: false, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('a-large');");
      expect(result).not.toContain("console.log('a-medium');");
      expect(result).toContain("console.log('a-small');");
      expect(result).not.toContain("console.log('a-nonpositive');");
    });

    it('should evaluate numeric comparison in if/elif chain - nonpositive', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: -5, X: false, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('a-large');");
      expect(result).not.toContain("console.log('a-medium');");
      expect(result).not.toContain("console.log('a-small');");
      expect(result).toContain("console.log('a-nonpositive');");
    });

    it('should handle logical AND in if branch', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: true, Y: true, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('xy-both');");
      expect(result).not.toContain("console.log('xy-either');");
      expect(result).not.toContain("console.log('xy-neither');");
    });

    it('should handle logical OR in elif branch', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: true, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('xy-both');");
      expect(result).toContain("console.log('xy-either');");
      expect(result).not.toContain("console.log('xy-neither');");
    });

    it('should handle logical NOT in second elif branch', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: false, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('xy-both');");
      expect(result).not.toContain("console.log('xy-either');");
      expect(result).toContain("console.log('xy-neither');");
    });

    it('should handle string equality in if/elif chain - prod', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: false, Y: false, TYPE: 'prod' } });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('production');");
      expect(result).not.toContain("console.log('development');");
      expect(result).not.toContain("console.log('testing');");
      expect(result).not.toContain("console.log('unknown-type');");
    });

    it('should handle string equality in if/elif chain - dev', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: false, Y: false, TYPE: 'dev' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('production');");
      expect(result).toContain("console.log('development');");
      expect(result).not.toContain("console.log('testing');");
      expect(result).not.toContain("console.log('unknown-type');");
    });

    it('should handle string equality in if/elif chain - test', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: false, Y: false, TYPE: 'test' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('production');");
      expect(result).not.toContain("console.log('development');");
      expect(result).toContain("console.log('testing');");
      expect(result).not.toContain("console.log('unknown-type');");
    });

    it('should handle string equality else branch', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: false, Y: false, TYPE: 'staging' } });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('production');");
      expect(result).not.toContain("console.log('development');");
      expect(result).not.toContain("console.log('testing');");
      expect(result).toContain("console.log('unknown-type');");
    });
  });

  describe('case13: Adjacent blocks and extreme nesting', () => {
    it('should handle adjacent independent if/elif blocks', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: false,
          B: false,
          C: true,
          D: false,
          E: false,
          F: true,
          L1: false,
          L2: false,
          L3: false,
          L4: false,
          L1_ALT: false,
          L2_ALT: false,
          L3_ALT: false,
          L4_ALT: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('block1-a');");
      expect(result).not.toContain("console.log('block2-b');");
      expect(result).toContain("console.log('block2-c');");
      expect(result).not.toContain("console.log('block3-d');");
      expect(result).not.toContain("console.log('block3-e');");
      expect(result).toContain("console.log('block3-f');");
      expect(result).not.toContain("console.log('block3-none');");
    });

    it('should handle extreme nesting 4 levels deep with if at each level', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: false,
          B: false,
          C: false,
          D: false,
          E: false,
          F: false,
          L1: true,
          L2: true,
          L3: true,
          L4: true,
          L1_ALT: false,
          L2_ALT: false,
          L3_ALT: false,
          L4_ALT: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('L1');");
      expect(result).toContain("console.log('L2');");
      expect(result).toContain("console.log('L3');");
      expect(result).toContain("console.log('L4-deepest');");
      expect(result).not.toContain("console.log('L4-alt');");
      expect(result).not.toContain("console.log('L3-alt');");
      expect(result).not.toContain("console.log('L2-alt');");
      expect(result).not.toContain("console.log('L1-alt');");
    });

    it('should handle extreme nesting with elif at level 4', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: false,
          B: false,
          C: false,
          D: false,
          E: false,
          F: false,
          L1: true,
          L2: true,
          L3: true,
          L4: false,
          L1_ALT: false,
          L2_ALT: false,
          L3_ALT: false,
          L4_ALT: true,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('L1');");
      expect(result).toContain("console.log('L2');");
      expect(result).toContain("console.log('L3');");
      expect(result).not.toContain("console.log('L4-deepest');");
      expect(result).toContain("console.log('L4-alt');");
      expect(result).not.toContain("console.log('L3-alt');");
      expect(result).not.toContain("console.log('L2-alt');");
      expect(result).not.toContain("console.log('L1-alt');");
    });

    it('should handle extreme nesting with elif at level 3', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: false,
          B: false,
          C: false,
          D: false,
          E: false,
          F: false,
          L1: true,
          L2: true,
          L3: false,
          L4: false,
          L1_ALT: false,
          L2_ALT: false,
          L3_ALT: true,
          L4_ALT: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('L1');");
      expect(result).toContain("console.log('L2');");
      expect(result).not.toContain("console.log('L3');");
      expect(result).not.toContain("console.log('L4-deepest');");
      expect(result).not.toContain("console.log('L4-alt');");
      expect(result).toContain("console.log('L3-alt');");
      expect(result).not.toContain("console.log('L2-alt');");
      expect(result).not.toContain("console.log('L1-alt');");
    });

    it('should handle extreme nesting with elif at top level', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: false,
          B: false,
          C: false,
          D: false,
          E: false,
          F: false,
          L1: false,
          L2: false,
          L3: false,
          L4: false,
          L1_ALT: true,
          L2_ALT: false,
          L3_ALT: false,
          L4_ALT: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('L1');");
      expect(result).not.toContain("console.log('L2');");
      expect(result).not.toContain("console.log('L3');");
      expect(result).not.toContain("console.log('L4-deepest');");
      expect(result).not.toContain("console.log('L4-alt');");
      expect(result).not.toContain("console.log('L3-alt');");
      expect(result).not.toContain("console.log('L2-alt');");
      expect(result).toContain("console.log('L1-alt');");
    });
  });

  describe('case14: Complex switch-like elif patterns', () => {
    it('should handle switch-like elif chain - value 1', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 1,
          OUTER: false,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('one');");
      expect(result).not.toContain("console.log('two');");
      expect(result).not.toContain("console.log('three');");
      expect(result).not.toContain("console.log('four');");
      expect(result).not.toContain("console.log('five');");
      expect(result).not.toContain("console.log('other');");
    });

    it('should handle switch-like elif chain - value 3', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 3,
          OUTER: false,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('one');");
      expect(result).not.toContain("console.log('two');");
      expect(result).toContain("console.log('three');");
      expect(result).not.toContain("console.log('four');");
      expect(result).not.toContain("console.log('five');");
      expect(result).not.toContain("console.log('other');");
    });

    it('should handle switch-like elif chain - default case', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 99,
          OUTER: false,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('one');");
      expect(result).not.toContain("console.log('two');");
      expect(result).not.toContain("console.log('three');");
      expect(result).not.toContain("console.log('four');");
      expect(result).not.toContain("console.log('five');");
      expect(result).toContain("console.log('other');");
    });

    it('should handle nested elif with multiple inner branches - outer true, inner_b', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 1,
          OUTER: true,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: true,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('outer-start');");
      expect(result).not.toContain("console.log('inner-a');");
      expect(result).toContain("console.log('inner-b');");
      expect(result).not.toContain("console.log('inner-c');");
      expect(result).not.toContain("console.log('inner-default');");
      expect(result).toContain("console.log('outer-middle');");
      expect(result).toContain("console.log('second-default');");
      expect(result).toContain("console.log('outer-end');");
    });

    it('should handle nested elif with multiple inner branches - outer true, second_a', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 1,
          OUTER: true,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: true,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('outer-start');");
      expect(result).toContain("console.log('inner-default');");
      expect(result).toContain("console.log('outer-middle');");
      expect(result).toContain("console.log('second-a');");
      expect(result).not.toContain("console.log('second-b');");
      expect(result).not.toContain("console.log('second-default');");
      expect(result).toContain("console.log('outer-end');");
    });

    it('should handle outer elif branch', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 1,
          OUTER: false,
          OUTER_ALT: true,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('outer-start');");
      expect(result).not.toContain("console.log('inner-a');");
      expect(result).not.toContain("console.log('outer-middle');");
      expect(result).toContain("console.log('outer-alt');");
      expect(result).not.toContain("console.log('outer-default');");
    });

    it('should handle outer else branch', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 1,
          OUTER: false,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('outer-start');");
      expect(result).not.toContain("console.log('outer-alt');");
      expect(result).toContain("console.log('outer-default');");
    });
  });

  describe('Error cases: malformed elif/else usage', () => {
    it('case15: should throw on unmatched elif (orphan elif)', () => {
      const code = loadjs('case15.js');
      const parser = new IfParser({ variables: { ORPHAN: true } });

      expect(() => parser.proceed(code)).toThrow(/[Uu]nmatched.*#elif/);
    });

    it('case16: should throw on malformed expression in elif', () => {
      const code = loadjs('case16.js');
      const parser = new IfParser({ variables: { VALID: true, BROKEN: true } });

      expect(() => parser.proceed(code)).toThrow();
    });

    it('case17: should handle multiple else blocks (parser converts to if-blocks)', () => {
      const code = loadjs('case17.js');
      const parser = new IfParser({ variables: { A: true } });

      // According to the parser logic, #else is treated as #endif + #if
      // Multiple #else after #if would create multiple sequential if blocks
      // The first else closes the if, the second else is orphaned
      expect(() => parser.proceed(code)).toThrow(/Cannot have #else or #elif after #else/);
    });
  });

  describe('Edge cases and stress tests', () => {
    it('should handle all conditions false in deeply nested structure', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: false,
          B: false,
          C: false,
          D: false,
          E: false,
          F: false,
          L1: false,
          L2: false,
          L3: false,
          L4: false,
          L1_ALT: false,
          L2_ALT: false,
          L3_ALT: false,
          L4_ALT: false,
        },
      });
      const result = parser.proceed(code);

      // All conditions are false, so all nested code should be removed
      expect(result).not.toContain("console.log('L1');");
      expect(result).not.toContain("console.log('L2');");
      expect(result).not.toContain("console.log('L3');");
      expect(result).not.toContain("console.log('L4-deepest');");
      expect(result).not.toContain("console.log('L4-alt');");
      expect(result).not.toContain("console.log('L3-alt');");
      expect(result).not.toContain("console.log('L2-alt');");
      expect(result).not.toContain("console.log('L1-alt');");
      expect(result).toContain("console.log('done13');");
    });

    it('should handle mixed true/false at different nesting levels', () => {
      const code = loadjs('case13.js');
      const parser = new IfParser({
        variables: {
          A: true,
          B: false,
          C: true,
          D: false,
          E: true,
          F: false,
          L1: true,
          L2: false,
          L3: false,
          L4: false,
          L1_ALT: false,
          L2_ALT: true,
          L3_ALT: false,
          L4_ALT: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('block1-a');");
      expect(result).toContain("console.log('block2-c');");
      expect(result).toContain("console.log('block3-e');");
      expect(result).toContain("console.log('L1');");
      expect(result).toContain("console.log('L2-alt');");
    });

    it('should preserve code outside all conditional blocks', () => {
      const code = loadjs('case10.js');
      const parser = new IfParser({
        variables: { A: false, B: false, C: false, X: false, Y: false, Z: false },
      });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('done10');");
      expect(result).not.toContain('#if');
      expect(result).not.toContain('#elif');
      expect(result).not.toContain('#else');
      expect(result).not.toContain('#endif');
    });

    it('should handle zero/falsy values in elif numeric comparisons', () => {
      const code = loadjs('case12.js');
      const parser = new IfParser({ variables: { A: 0, X: false, Y: false, TYPE: 'unknown' } });
      const result = parser.proceed(code);

      expect(result).toContain("console.log('a-nonpositive');");
    });

    it('should handle long elif chain with all false except last', () => {
      const code = loadjs('case14.js');
      const parser = new IfParser({
        variables: {
          VAL: 5,
          OUTER: false,
          OUTER_ALT: false,
          INNER_A: false,
          INNER_B: false,
          INNER_C: false,
          SECOND_A: false,
          SECOND_B: false,
        },
      });
      const result = parser.proceed(code);

      expect(result).not.toContain("console.log('one');");
      expect(result).not.toContain("console.log('two');");
      expect(result).not.toContain("console.log('three');");
      expect(result).not.toContain("console.log('four');");
      expect(result).toContain("console.log('five');");
      expect(result).not.toContain("console.log('other');");
    });
  });
});
