import * as acorn from 'acorn';

export class IfParser {
  private static readonly IF_MACRO_REGEX = new RegExp(`^(${Dirv.If}|${Dirv.Endif})\\b`);

  private readonly _opts: Opts;
  private readonly varKeys: string[] = [];
  private readonly varValues: any[] = [];
  constructor(_opts: Opts) {
    this._opts = _opts;
    const kvArray = Object.entries(this._opts.variables);
    for (let i = 0; i < kvArray.length; i++) {
      const kv = kvArray[i];
      this.varKeys.push(kv[0]);
      this.varValues.push(kv[1]);
    }
  }

  /**
   * Analyzing code with acorn
   */
  proceed(code: string): { code: string; map: null } | null {
    console.log('proceeding...');
    const blocks: DirvBlock[] = [];
    const toBlock: typeof this.tryParseToBlock = (r, s, e) => this.tryParseToBlock(r, s, e);

    acorn.parse(code, {
      ecmaVersion: 'latest',
      /**
       * @param isBlock whether its a '/⋆ ... ⋆/' comment
       * @param text text inside the comment, excludes the boundaries
       * @param start start index, includes boundary
       * @param end end index, boundary + 1
       */
      onComment(isBlock, text, start, end) {
        if (isBlock) {
          return; // * Only allows non-block directives: '// #if ...'
        }

        const b = toBlock(text, start, end);
        b && blocks.push(b);
      },
    });

    const ifNodes = this.collect(blocks);

    console.dir(ifNodes, { depth: 6 });

    if (ifNodes.length === 0) {
      return null;
    } else {
      return {
        code: '',
        map: null,
      };
    }
  }

  /**
   * Check whether the normal `if` syntax is correct and add `indexes` to each `IfChainNode`
   * - [NOTE] will convert `else` to `elif true`, more convenient for later processing
   *
   * rule: must match if → (elif)* → (else)? → endif, * and ? here are the same as they are in regex
   */
  collect(dirvBlocks: DirvBlock[]): IfBlock[] {
    if (dirvBlocks.length === 0) {
      return [];
    } else if (dirvBlocks.length === 1) {
      throw new Error(`Must have at least 2 directives, got orphaned '${dirvBlocks[0].dirv}'`);
    }

    const result: IfBlock[] = [];
    const stack: IfBlock[] = [];
    for (let i = 0; i < dirvBlocks.length; i++) {
      const b = dirvBlocks[i];
      if (b.dirv === Dirv.If) {
        const newIfBlock: IfBlock = {
          condition: b.condition as boolean,
          start: b.start,
          end: Infinity, // to be filled when '#endif' is found
          children: [],
        };

        // ! Order of expressions below cannot be changed!
        if (stack.length === 0) {
          result.push(newIfBlock);
        } else {
          stack[stack.length - 1].children.push(newIfBlock);
        }
        stack.push(newIfBlock);
        continue;
      }

      if (b.dirv === Dirv.Endif) {
        // must have a corresponding '#if'
        if (stack.length === 0) {
          throw new Error(`Unmatched '#endif' at ${b.start}:${b.end}`);
        }
        const lastIf = stack.pop() as IfBlock;
        lastIf.end = b.end;
        continue;
      }
    }

    return result;
  }

  /**
   * Parse the comment to a `IfMacroBlock`
   * @param raw trimmed comment text
   */
  tryParseToBlock(raw: string, start: number, end: number): DirvBlock | null {
    raw = raw.replace(/(^|\n)[*\s]+/g, '');
    let dirv = null as Dirv | null;
    const expr = raw.replace(IfParser.IF_MACRO_REGEX, (_, $1: Dirv) => ((dirv = $1), '')).trim();
    if (dirv === null) {
      return null;
    }

    const condition = dirv === Dirv.If ? this.evaluate(expr) : null;

    return { dirv, condition, start, end };
  }

  /**
   * Apply the transformations to the code
   * - detects empty blocks and give a warning message
   */
  apply(ifBlocks: IfBlock[]): string {
    return '';
  }

  /**
   * & Most imaginative part
   */
  evaluate(expr: string): boolean {
    const fn = new Function(...this.varKeys, `return (${expr})`);
    try {
      const result = fn(...this.varValues);
      return Boolean(result);
    } catch (e) {
      throw new Error(`"${expr}" with error ${e instanceof Error ? e.message : e}`);
    }
  }
}
