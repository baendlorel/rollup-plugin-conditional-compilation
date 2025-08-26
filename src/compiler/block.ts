import { Dirv } from '@/consts/directives.js';
import { evaluate } from './evaluate.js';

const IF_MACRO_REGEX = new RegExp(`^(${Dirv.If}|${Dirv.Else}|${Dirv.Elif}|${Dirv.Endif})\\b`);

function isIf(block: DirvBlock): block is DirvBlock<Dirv.If> {
  return block.dirv === Dirv.If;
}

function isElif(block: DirvBlock): block is DirvBlock<Dirv.Elif> {
  return block.dirv === Dirv.Elif;
}

function isElse(block: DirvBlock): block is DirvBlock<Dirv.Else> {
  return block.dirv === Dirv.Else;
}

function isEndif(block: DirvBlock): block is DirvBlock<Dirv.Endif> {
  return block.dirv === Dirv.Endif;
}

/**
 * Parse the comment to a `IfMacroBlock`
 * @param context Composed thisArg and plugin options
 * @param text trimmed comment text
 * @returns `null` when the comment is not a `if` macro
 * @throws when the syntax is invalid
 */
export function toBaseDirvBlockOrNull(context: Context, text: string): BaseDirvBlock | null {
  text = text.replace(/(^|\n)[*\s]+/g, '');
  let dirv: Dirv | null = null;
  const expr = text
    .replace(IF_MACRO_REGEX, (_, $1: Dirv) => {
      dirv = $1;
      return '';
    })
    .trim();

  if (dirv === null) {
    return null;
  }

  if ((dirv === Dirv.Else || dirv === Dirv.Endif) && expr !== '') {
    context.this.error(`'${dirv}' should not have any expression, but got: "${expr}"`);
  }

  const condition = dirv === Dirv.If || dirv === Dirv.Elif ? evaluate(context, expr) : null;

  return {
    dirv,
    condition,
  };
}

/**
 * Check whether the normal `if` syntax is correct and add `indexes` to each `IfChainNode`
 * - [NOTE] will convert `else` to `elif true`, more convenient for later processing
 *
 * rule: must match if → (elif)* → (else)? → endif, * and ? here are the same as they are in regex
 * @param context Composed thisArg and plugin options
 * @param dirvBlocks created by `toBaseDirvBlock`
 */
export function toIfNodes(context: Context, dirvBlocks: DirvBlock[]): IfNode[] {
  if (dirvBlocks.length === 0) {
    return [];
  } else if (dirvBlocks.length === 1) {
    context.this.error(`Must have at least 2 directives, got orphaned '${dirvBlocks[0].dirv}'`);
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
  // todo 要有两个stack，一个是if的stack，一个是所有node的stack用来判断现在是谁的children
  const rootStack: IfNode[] = [];
  const stack: IfNode[] = [];

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

      if (rootStack.length > 0) {
        const children = rootStack[rootStack.length - 1].children;
        if (children) {
          children.push(child);
        } else {
          rootStack[rootStack.length - 1].children = [child];
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
        context.this.error(`Multiple '${Dirv.Else}' in the same 'if' block, directive index: ${i}`);
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

  hasElse.clear();

  if (rootStack.length !== 0) {
    context.this.error(`Unclosed '${Dirv.If}', missing '${Dirv.Endif}'`);
  }

  return nodes;
}
