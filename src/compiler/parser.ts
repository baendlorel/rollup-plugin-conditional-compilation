import * as acorn from 'acorn';

export class ConditionalCompilationParser {
  private static readonly IF_MACRO_REGEX = new RegExp(
    `^(${Dirv.If}|${Dirv.Else}|${Dirv.Elif}|${Dirv.Endif})\\b`
  );

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
  proceed(code: string): string {
    console.log('proceeding...');
    const dirvBlocks: DirvBlock[] = [];
    const toBlock = (text: string) => this.toBaseDirvBlockOrNull(text);

    acorn.parse(code, {
      ecmaVersion: 'latest',
      // locations: true, // & When locations is true, onComment will receive startLoc, endLoc. But it is useless here
      onComment(isBlock, text, start, end) {
        // & Only allows block comments like `/* #if ... */`, `// #if` is ignored
        if (!isBlock) {
          return;
        }

        const baseDirvBlock = toBlock(text.trim());
        if (!baseDirvBlock) {
          return;
        }

        dirvBlocks.push(Object.assign({ start, end, children: [] }, baseDirvBlock));
      },
    });

    const ifNodes = toIfNodes(context, dirvBlocks);

    console.dir(ifNodes, { depth: 6 });
    return apply(ifNodes);
  }

  /**
   * Check whether the normal `if` syntax is correct and add `indexes` to each `IfChainNode`
   * - [NOTE] will convert `else` to `elif true`, more convenient for later processing
   *
   * rule: must match if → (elif)* → (else)? → endif, * and ? here are the same as they are in regex
   */
  toIfNodes(dirvBlocks: DirvBlock[]): IfNode[] {
    if (dirvBlocks.length === 0) {
      return [];
    } else if (dirvBlocks.length === 1) {
      throw new Error(`Must have at least 2 directives, got orphaned '${dirvBlocks[0].dirv}'`);
    }

    const attach = (start: IfNode, next: IfNode) => {
      let last: IfNode = start;
      while (last.next !== undefined) {
        last = last.next;
      }
      last.next = next;
    };

    const nodes: IfNode[] = [];

    const hasElse = new Set<IfNode>();
    const rootStack: IfNode[] = [];
    const parentStack: IfNode[] = [];

    for (let i = 0; i < dirvBlocks.length; i++) {
      const b = dirvBlocks[i];

      // next level
      if (isIf(b)) {
        const child: IfNode = {
          dirv: b.dirv,
          condition: b.condition,
          start: b.start,
          end: b.end,
        };

        if (parentStack.length > 0) {
          const children = parentStack[parentStack.length - 1].children;
          if (children) {
            children.push(child);
          } else {
            parentStack[parentStack.length - 1].children = [child];
          }
        }

        rootStack.push(child);

        // only push root node
        if (rootStack.length === 1) {
          nodes.push(child);
        }
        continue;
      }

      if (rootStack.length === 0) {
        context.this.error(`Unexpected '${b.dirv}', directive index: ${i}`);
      }

      const current = rootStack[rootStack.length - 1];
      if (isEndif(b)) {
        attach(current, {
          dirv: b.dirv,
          start: b.start,
          end: b.end,
        });
        rootStack.pop();
        continue;
      }

      // lateral
      if (isElse(b)) {
        if (hasElse.has(current)) {
          context.this.error(
            `Multiple '${Dirv.Else}' in the same 'if' block, directive index: ${i}`
          );
        }
        hasElse.add(current);
        attach(current, {
          dirv: b.dirv,
          condition: true,
          start: b.start,
          end: b.end,
        });
        continue;
      }

      if (isElif(b)) {
        if (hasElse.has(current)) {
          context.this.error(
            `'${Dirv.Elif}' cannot appear after '${Dirv.Else}', directive index: ${i}`
          );
        }
        attach(current, {
          dirv: b.dirv,
          condition: b.condition,
          start: b.start,
          end: b.end,
        });
        continue;
      }
    }

    if (rootStack.length !== 0) {
      context.this.error(`Unclosed '${Dirv.If}', missing '${Dirv.Endif}'`);
    }

    hasElse.clear();
    return nodes;
  }

  /**
   * Parse the comment to a `IfMacroBlock`
   * @param text trimmed comment text
   */
  toBaseDirvBlockOrNull(text: string): BaseDirvBlock | null {
    text = text.replace(/(^|\n)[*\s]+/g, '');
    let dirv = null as Dirv | null;
    const expr = text
      .replace(ConditionalCompilationParser.IF_MACRO_REGEX, (_, $1: Dirv) => {
        dirv = $1;
        return '';
      })
      .trim();

    if (dirv === null) {
      return null;
    }

    const needCondition = dirv === Dirv.If || dirv === Dirv.Elif;

    if (!needCondition && expr !== '') {
      throw new Error(`'${dirv}' should not have any expression, but got: "${expr}"`);
    }

    const condition = needCondition ? this.evaluate(expr) : null;

    return {
      dirv,
      condition,
    };
  }

  /**
   * Apply the transformations to the code
   * - detects empty blocks and give a warning message
   */
  apply(ifBlocks: IfNode[]): string {
    return '';
  }

  /**
   * ## Most imaginative part
   * - left variables assignment and calculation to `new Function`
   *   - there is no way to be more precise and simple
   * - this makes the expression is evaluated under JavaScript Syntax
   */
  private evaluate(expr: string): boolean {
    const fn = new Function(...this.varKeys, `return (${expr})`);
    try {
      const result = fn(...this.varValues);
      return Boolean(result);
    } catch (e) {
      throw new Error(`"${expr}" with error ${e instanceof Error ? e.message : e}`);
    }
  }
}
