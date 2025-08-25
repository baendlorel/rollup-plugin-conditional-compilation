import * as acorn from 'acorn';
import type { Plugin, TransformPluginContext } from 'rollup';
import { normalize } from './normalizer.js';
import { toBaseDirvBlock, toIfNodes } from './block.js';

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
