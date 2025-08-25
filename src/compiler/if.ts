import * as acorn from 'acorn';
import type { Plugin, TransformPluginContext } from 'rollup';
import { Dirv } from '../consts/directives.js';
import { normalize } from './normalizer.js';
import { fromElseToGeneric, isElif, isElse, isEndif, isIf } from './block.js';

const IF_MACRO_REGEX = new RegExp(`^(${Dirv.If}|${Dirv.Else}|${Dirv.Elif}|${Dirv.Endif})\\b`);

/**
 * @param options options of the plugin
 *
 * __PKG_INFO__
 *
 */
export function conditionalCompilation(options?: Partial<__OPTS__>): Plugin {
  const opts = normalize(options);

  return {
    name: '__KEBAB_NAME__',
    transform(this: TransformPluginContext, code: string, id: string) {
      if (typeof opts === 'string') {
        this.error(opts);
      }

      const context: Context = {
        options: opts,
        this: this,
        code,
        id,
      };
      try {
        return proceed(context);
      } catch (error) {
        this.error(`error in ${id} - ${error instanceof Error ? error.message : error}`);
      }
    },
  };
}

/**
 * Analyzing code with acorn
 * @param context Composed thisArg and plugin options
 * @param code source coude
 */
export function proceed(context: Context): string {
  console.log('proceeding...');
  const dirvBlocks: DirvBlock[] = [];
  acorn.parse(context.code, {
    ecmaVersion: context.options.ecmaVersion,
    sourceType: context.options.sourceType,
    // locations: true, // & When locations is true, onComment will receive startLoc, endLoc. But it is useless here
    onComment(isBlock, text, start, end) {
      // & Only allows block comments like `/* #if ... */`, `// #if` is ignored
      if (!isBlock) {
        return;
      }

      const baseDirvBlock = toBaseDirvBlock(context, text.trim());
      if (!baseDirvBlock) {
        return;
      }

      dirvBlocks.push(Object.assign({ start, end }, baseDirvBlock));
    },
  });

  const ifNodes = toIfNodes(context, dirvBlocks);

  console.log('ifNodes.length', ifNodes.length);
  console.dir(ifNodes, { depth: 6 });
  return apply(context, ifNodes);
}

/**
 * [INFO] This is the most imaginative part of the whole project
 * - left variables assignment and calculation to `new Function`
 *   - there is no way to be more precise and simple
 * - this makes the expression is evaluated under JavaScript Syntax
 * @param context Composed thisArg and plugin options
 * @param expr expression comes after `#if` or `#elif`
 * @returns the boolean result of the expression
 * @throws when the expression is invalid, it is determined by `new Function`
 */
function evaluate(context: Context, expr: string): boolean {
  const v = context.options.variables;
  const fn = new Function(...v.keys, `return (${expr})`);
  try {
    const result = fn(...v.values);
    return Boolean(result);
  } catch (e) {
    context.this.error(
      `Invalid expression: "${expr}" with error ${e instanceof Error ? e.message : e}`
    );
  }
}

/**
 * Parse the comment to a `IfMacroBlock`
 * @param context Composed thisArg and plugin options
 * @param text trimmed comment text
 * @returns `null` when the comment is not a `if` macro
 * @throws when the syntax is invalid
 */
function toBaseDirvBlock(context: Context, text: string): BaseDirvBlock | null {
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
    children: [],
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
function toIfNodes(context: Context, dirvBlocks: DirvBlock[]): IfNode[] {
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

/**
 * Apply the transformations to the code
 * - detects empty blocks and give a warning
 * @param context Composed thisArg and plugin options
 * @param ifBlocks
 */
function apply(context: Context, ifBlocks: IfNode[]): string {
  // const codeBlocks: string[] = [];
  // const _apply = (ifBlock: IfNode) => {
  //   if (ifBlock.if.condition) {
  //     if (ifBlock.if.children.length === 0) {
  //       codeBlocks.push(code.slice(ifBlock.if.end + 1, 下一个块.start));
  //     } else {
  //       ifBlock.if.children.forEach(_apply);
  //     }
  //     return;
  //   }
  //   for (let i = 0; i < ifBlock.elif.length; i++) {
  //     const elif = ifBlock.elif[i];
  //     if (elif.condition) {
  //     }
  //   }
  // };
  // for (let i = 0; i < ifBlocks.length; i++) {
  //   const b = ifBlocks[i];
  //   if (b.if.condition) {
  //   }
  // }
}
