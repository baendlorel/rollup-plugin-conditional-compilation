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
export function toBaseDirvBlock(context: Context, text: string): BaseDirvBlock | null {
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
 * Check whether the normal `if` syntax is correct and add `indexes` to each `IfBlock`
 * - [NOTE] will convert `else` to `elif true`, more convenient for later processing
 *
 * rule: must match if → (elif)* → (else)? → endif, * and ? here are the same as they are in regex
 * @param context Composed thisArg and plugin options
 * @param dirvBlocks created by `toBaseDirvBlock`
 */
export function toIfNodes(context: Context, dirvBlocks: DirvBlock[]): IfNode[] {
  if (dirvBlocks.length === 0) {
    return [];
  }

  if (dirvBlocks.length === 1) {
    context.this.error(`Must have at least 2 directives, got orphaned '${dirvBlocks[0].dirv}'`);
  }

  const ifNodes: IfNode[] = [];

  /**
   * Only stores blocks of `Dirv.If`, and when they are closed, they will be poped.
   */
  const stack: IfNode[] = [];

  let current: IfNode | null = null;
  let hasElse = false;
  let children: IfNode[] | null = null;

  const createIfNode = (dirvBlock: DirvBlock<Dirv.If>): IfNode => ({
    parent: stack.length === 0 ? null : stack[stack.length - 1],
    blocks: [
      {
        condition: dirvBlock.condition,
        children: dirvBlock.children,
        start: dirvBlock.start,
        end: dirvBlock.end,
      },
    ],
    endif: null as any, // will be assigned later
  });

  // todo 可以用weakmap来保存 blocks数组里每一项对应的index
  for (let i = 0; i < dirvBlocks.length; i++) {
    const dirvBlock = dirvBlocks[i];
    if (isIf(dirvBlock)) {
      current = createIfNode(dirvBlock);
      children = dirvBlock.children;
      if (current.parent === null) {
        ifNodes.push(current);
      } else {
        // todo 加入到父级别的blocks对应的children里
      }
      stack.push(current);
      continue;
    } else if (current === null) {
      // & this is equivalent to `stack.length === 0`
      context.this.error(
        `Orphaned '${dirvBlock.dirv}', must be preceded by '${Dirv.If}', directive index: ${i}`
      );
    }

    if (isEndif(dirvBlock)) {
      if (stack.length === 0) {
        context.this.error(`Unmatched '${Dirv.Endif}', directive index: ${i}`);
      }

      hasElse = false;
      children = null;
      current.endif = dirvBlock;

      stack.pop();
      current = stack.length > 0 ? stack[stack.length - 1] : null;
      continue;
    }

    if (isElse(dirvBlock)) {
      if (hasElse) {
        context.this.error(`Multiple '${Dirv.Else}' in the same 'if' block, directive index: ${i}`);
      }

      hasElse = true;
      children = dirvBlock.children;
      current.blocks.push(fromElseToGeneric(dirvBlock));
      continue;
    }

    if (isElif(dirvBlock)) {
      if (hasElse) {
        context.this.error(
          `'${Dirv.Elif}' cannot appear after '${Dirv.Else}', directive index: ${i}`
        );
      }
      children = dirvBlock.children;
      current.blocks.push(dirvBlock);
      continue;
    }
  }

  if (stack.length !== 0) {
    context.this.error(`Unclosed '${Dirv.If}', missing '${Dirv.Endif}'`);
  }

  return ifNodes;
}

export function toIfChainConditionNodes(context: Context, dirvBlocks: DirvBlock[]): IfChainNode[] {
  if (dirvBlocks.length === 0) {
    return [];
  } else if (dirvBlocks.length === 1) {
    context.this.error(`Must have at least 2 directives, got orphaned '${dirvBlocks[0].dirv}'`);
  }

  const attach = (start: IfChainNode, next: IfChainNode) => {
    let last: IfChainNode = start;
    while (last.next !== undefined) {
      last = last.next;
    }
    last.next = next;
  };

  const nodes: IfChainNode[] = [];
  const hasElse = new Set<IfChainNode>();
  const stack: IfChainNode[] = [];

  for (let i = 0; i < dirvBlocks.length; i++) {
    const b = dirvBlocks[i];

    // next level
    if (isIf(b)) {
      const child: IfChainNode = {
        condition: b.condition,
        start: b.start,
        end: b.end,
      };
      const children = stack[stack.length - 1].children;
      if (children) {
        children.push(child);
      } else {
        stack[stack.length - 1].children = [child];
      }

      stack.push(child);

      // only push root node
      if (stack.length === 1) {
        nodes.push(child);
      }
      continue;
    }

    if (stack.length === 0) {
      context.this.error(`Unexpected '${b.dirv}', directive index: ${i}`);
    }

    const current = stack[stack.length - 1];
    if (isEndif(b)) {
      attach(current, {
        start: b.start,
        end: b.end,
      });
      stack.pop();
      continue;
    }

    // lateral
    if (isElse(b)) {
      if (hasElse.has(current)) {
        context.this.error(`Multiple '${Dirv.Else}' in the same 'if' block, directive index: ${i}`);
      }
      hasElse.add(current);
      attach(current, {
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
        condition: b.condition,
        start: b.start,
        end: b.end,
      });
      continue;
    }
  }

  hasElse.clear();

  if (stack.length !== 0) {
    context.this.error(`Unclosed '${Dirv.If}', missing '${Dirv.Endif}'`);
  }

  return nodes;
}
