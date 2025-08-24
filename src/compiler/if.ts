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
      console.log('test', `[${text}]`);
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
  console.log('evaluating', ...v.keys, `return (${expr})`, Boolean(result));
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
    context.this.error(`Must have at least 2 directives`);
  }

  if (indexlessBlocks[0].dirv !== Dirv.If) {
    context.this.error(`The first directive must be '${Dirv.If}'`);
  }

  const blocks: DirvBlock[] = [];

  /**
   * Create a full version of `DirvBlock` from `IndexlessDirvBlock` and push it to `blocks[]`
   * @param index index in `indexlessBlocks[]`
   * @param indexes shares the same `indexes` object in the same `if` group
   * @returns the pushed block data object
   */
  const push = (index: number, indexes: DirvBlockIndexes): DirvBlock => {
    const indexData: Pick<DirvBlock, 'indexes' | 'elifIndex'> = {
      indexes,
      elifIndex: -1,
    };
    const b: DirvBlock = Object.assign(indexData, indexlessBlocks[index]);
    blocks.push(b);
    return b;
  };

  // & now we have at least 2 directives, and the first one is '#if'
  const iter = (startIndex: number): void => {
    const indexes: DirvBlockIndexes = {
      if: startIndex,
      elif: [],
      else: -1,
      endif: -1,
    };
    push(startIndex, indexes);

    for (let i = startIndex + 1; i < indexlessBlocks.length; i++) {
      const b = push(i, indexes);

      switch (b.dirv) {
        case Dirv.If:
          iter(i);
          break;
        case Dirv.Elif:
          if (indexes.else !== -1) {
            context.this.error(`'${Dirv.Elif}' cannot appear after '${Dirv.Else}'`);
          }
          b.elifIndex = indexes.elif.push(i) - 1;
          break;
        case Dirv.Else:
          if (indexes.else !== -1) {
            context.this.error(`Multiple '${Dirv.Else}' in the same 'if' block`);
          }
          indexes.else = i;
          break;
        case Dirv.Endif:
          indexes.endif = i;
          return; // closed with endif, if the syntax is correct, checker should return here
      }
    }

    // not end with endif
    context.this.error(`'${Dirv.Endif}' is missing`);
  };

  iter(0);

  return blocks;
}
