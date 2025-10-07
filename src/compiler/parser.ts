import * as acorn from 'acorn';

export class IfParser {
  private static readonly _REG = new RegExp(
    `^(${Dirv.If}|${Dirv.Endif}|${Dirv.Elif}|${Dirv.Else})\\b`
  );

  private readonly _opts: Opts;
  private readonly _keys: string[] = [];
  private readonly _values: any[] = [];
  constructor(_opts: Opts) {
    this._opts = _opts;
    const kv = Object.entries(this._opts.variables);
    for (let i = 0; i < kv.length; i++) {
      this._keys.push(kv[i][0]);
      this._values.push(kv[i][1]);
    }
  }

  /**
   * Analyzing code with acorn
   */
  proceed(code: string): string | null {
    const dirvBlocks = this.toDirvBlocks(code);
    if (dirvBlocks.length === 0) {
      return null;
    }

    const ifBlocks = this.toIfBlocks(dirvBlocks);
    return this.compile(code, ifBlocks);
  }

  toDirvBlocks(code: string): DirvBlock[] {
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
    return blocks;
  }

  /**
   * Parse the comment to a `IfMacroBlock`
   * @param raw trimmed comment text
   */
  private tryParseToBlock(raw: string, start: number, end: number): DirvBlock | null {
    raw = raw.replace(/(^|\n)[*\s]+/g, '');
    let dirv = null as Dirv | null;
    const expr = raw.replace(IfParser._REG, (_, $1: Dirv) => ((dirv = $1), '')).trim();
    if (dirv === null) {
      return null;
    }

    let condition: boolean;
    switch (dirv) {
      case Dirv.If:
      case Dirv.Elif:
        condition = this.evaluate(expr);
        break;
      case Dirv.Else:
        condition = true;
      case Dirv.Endif:
        condition = false;
      default:
        throw new Error('Unexpected directive ' + dirv);
    }

    return { dirv, condition, start, end };
  }

  toIfBlocks(dirvBlocks: DirvBlock[]): IfBlock[] {
    if (dirvBlocks.length === 0) {
      return [];
    } else if (dirvBlocks.length === 1) {
      throw new Error(`Must have at least 2 directives, got orphaned '${dirvBlocks[0].dirv}'`);
    }

    const result: IfBlock[] = [];
    const stack: IfBlock[] = [];

    const addIfBlock = (b: DirvBlock, condition: boolean): void => {
      const newIfBlock: IfBlock = {
        condition: condition,
        children: [],

        ifStart: b.start,
        ifEnd: b.end,
        endifStart: NaN, // to be filled when '#endif' is found
        endifEnd: NaN, // to be filled when '#endif' is found
      };

      // ! Order of expressions below cannot be changed!
      if (stack.length === 0) {
        result.push(newIfBlock);
      } else {
        stack[stack.length - 1].children.push(newIfBlock);
      }
      stack.push(newIfBlock);
    };

    for (let i = 0; i < dirvBlocks.length; i++) {
      const b = dirvBlocks[i];
      if (b.dirv === Dirv.If) {
        addIfBlock(b, b.condition);
        continue;
      }

      // Since we consider other 3 directives as 'endif' + 'if'
      // the 3 must have a corresponding '#if' to it
      // & original Dirv.Endif handler shares the same logic
      if (stack.length === 0) {
        throw new Error(`Unmatched '${b.dirv}' at ${b.start}:${b.end}`);
      }
      const lastIf = stack.pop() as IfBlock;
      lastIf.endifStart = b.start;
      lastIf.endifEnd = b.end;

      if (b.dirv === Dirv.Endif) {
        continue;
      }

      // $ Here we convert 'elif' and 'else' to 'endif' + 'if not previous condition'
      if (b.dirv === Dirv.Else) {
        addIfBlock(b, !lastIf.condition);
        continue;
      }

      if (b.dirv === Dirv.Elif) {
        addIfBlock(b, !lastIf.condition && b.condition);
        continue;
      }
    }

    if (stack.length === 0) {
      throw new Error('Unclosed directive blocks found: ' + JSON.stringify(stack));
    }

    return result;
  }

  /**
   * Apply the transformations to the code
   * - Only handles `ifBlocks.length > 0` here, =0 will be returned outside
   */
  compile(code: string, ifBlocks: IfBlock[]): string {
    const drop: number[] = [];

    const visit = (ifBlock: IfBlock) => {
      if (!ifBlock.condition) {
        drop.push(ifBlock.ifStart, ifBlock.endifEnd);
        return;
      }

      drop.push(ifBlock.ifStart, ifBlock.ifEnd); // drop the `#if ...` line
      for (let i = 0; i < ifBlock.children.length; i++) {
        visit(ifBlock.children[i]);
      }
      drop.push(ifBlock.endifStart, ifBlock.endifEnd); // drop the `#endif ...` line
    };

    for (let i = 0; i < ifBlocks.length; i++) {
      visit(ifBlocks[i]);
    }

    // & now we get the indexes needs to be kept
    const keep = [0, ...drop, code.length];

    const result: string[] = [];
    for (let i = 0; i < keep.length; i += 2) {
      result.push(code.slice(keep[i], keep[i + 1]));
    }

    return result.join('');
  }

  /**
   * & Most imaginative part
   */
  evaluate(expr: string): boolean {
    const fn = new Function(...this._keys, `return (${expr})`);
    try {
      const result = fn(...this._values);
      return Boolean(result);
    } catch (e) {
      throw new Error(`"${expr}" with error ${e instanceof Error ? e.message : e}`);
    }
  }
}
