import * as acorn from 'acorn';
import type { Plugin, TransformPluginContext } from 'rollup';
import { Dirv } from '../consts/directives.js';
import { normalize } from './normalizer.js';

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
      };
      try {
        return proceed(context, code);
      } catch (error) {
        this.error(`error in ${id} - ${error instanceof Error ? error.message : error}`);
      }
    },
  };
}

/**
 * Analyzing code with acorn
 * @param code source coude
 * @param globals global variables
 */
export function proceed(context: Context, code: string): string {
  console.log('proceeding...');
  const indexlessBlocks: IndexlessDirvBlock[] = [];
  acorn.parse(code, {
    ecmaVersion: context.options.ecmaVersion,
    sourceType: context.options.sourceType,
    // locations: true, // & When locations is true, onComment will receive startLoc, endLoc. But it is useless here
    onComment(isBlock, text, start, end) {
      if (!isBlock) {
        return;
      }

      const minimalDirvBlock = parse(context, text.trim());
      if (!minimalDirvBlock) {
        return;
      }

      indexlessBlocks.push(Object.assign({ start, end }, minimalDirvBlock));
    },
  });
  toIfBlock(context, indexlessBlocks);

  return '';
}

/**
 * Parse the comment to a `IfMacroBlock`
 * @param text trimmed comment text
 * @returns `null` when the comment is not a `if` macro
 * @throws when the syntax is invalid
 */
function parse(context: Context, text: string): MinimalDirvBlock | null {
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

function evaluate(context: Context, expr: string): boolean {
  const v = context.options.variables;
  const fn = new Function(...v.keys, `return (${expr})`);
  const result = fn(...v.values);
  console.log('evaluating', `(${expr})`, Boolean(result));
  return Boolean(result);
}

/**
 * Check whether the normal `if` syntax is correct and add `indexes` to each `IfBlock`
 *
 * rule: must match if → (elif)* → (else)? → endif, * and ? here are the same as they are in regex
 * @param indexlessBlocks
 * @throws
 */
function toIfBlock(context: Context, indexlessBlocks: IndexlessDirvBlock[]): DirvBlock[] {
  // [INFO] the nesting of `if` block is "isomorphic" to a recursive function call

  if (indexlessBlocks.length === 0) {
    return [];
  }

  if (indexlessBlocks.length === 1) {
    context.this.error(
      `Must have at least 2 directives, got orphaned '${indexlessBlocks[0].dirv}'`
    );
  }

  if (indexlessBlocks[0].dirv !== Dirv.If) {
    context.this.error(`The first directive must be '${Dirv.If}'`);
  }

  const createIfBlock = (i: number): DirvBlock =>
    Object.assign(
      {
        indexes: {
          if: i,
          elif: [],
          else: -1,
          endif: -1,
        },
        elifIndex: -1,
      },
      indexlessBlocks[i]
    );

  const blocks: DirvBlock[] = [createIfBlock(0)];

  /**
   * Only stores blocks of `Dirv.If`, and when they are closed, they will be poped.
   */
  const stack: DirvBlock[] = [blocks[0]];

  const createOtherBlock = (i: number): DirvBlock =>
    Object.assign(
      {
        indexes: stack[stack.length - 1].indexes,
        elifIndex: -1,
      },
      indexlessBlocks[i]
    );

  for (let i = 1; i < indexlessBlocks.length; i++) {
    const currentIndexes = stack[stack.length - 1].indexes;
    const ib = indexlessBlocks[i];
    if (ib.dirv === Dirv.If) {
      const b = createIfBlock(i);
      blocks.push(b);
      stack.push(b);
      continue;
    }

    const b = createOtherBlock(i);
    if (ib.dirv === Dirv.Endif) {
      currentIndexes.endif = i;
      blocks.push(b);
      if (stack.length > 0) {
        stack.pop();
      } else {
        context.this.error(`Unmatched '${Dirv.Endif}', directive index: ${i}`);
      }
      continue;
    }

    if (ib.dirv === Dirv.Else) {
      if (currentIndexes.else !== -1) {
        context.this.error(`Multiple '${Dirv.Else}' in the same 'if' block, directive index: ${i}`);
      }
      currentIndexes.else = i;
      blocks.push(b);
      continue;
    }

    if (ib.dirv === Dirv.Elif) {
      if (currentIndexes.else !== -1) {
        context.this.error(
          `'${Dirv.Elif}' cannot appear after '${Dirv.Else}', directive index: ${i}`
        );
      }
      b.elifIndex = currentIndexes.elif.push(i) - 1;
      blocks.push(b);
      continue;
    }
  }

  if (stack.length !== 0) {
    context.this.error(`Unclosed '${Dirv.If}', missing '${Dirv.Endif}'`);
  }

  console.log(blocks.map((b) => b.dirv));
  return blocks;
}
