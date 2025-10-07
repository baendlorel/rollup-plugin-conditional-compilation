import * as acorn from 'acorn';
import type { Plugin, TransformPluginContext } from 'rollup';
import { toBaseDirvBlockOrNull, toIfNodes } from './block.js';
import { RollupConditionalCompilationOptions } from '@/types/global.js';

/**
 * @param options options of the plugin
 *
 * __PKG_INFO__
 *
 */
export function conditionalCompilation(
  options: Partial<RollupConditionalCompilationOptions> = {}
): Plugin {
  const opts = normalize(options);

  return {
    name: '__KEBAB_NAME__',
    transform(this: TransformPluginContext, code: string, id: string) {
      if (typeof opts === 'string') {
        this.error(opts);
      }
      try {
        return proceed(options);
      } catch (error) {
        this.error(`error in ${id} - ${error instanceof Error ? error.message : error}`);
      }
    },
  };
}

function normalize(options: Partial<Opts>): Opts {
  if (typeof options !== 'object' || options === null) {
    throw new Error(`Invalid options: '${options}', must be an object`);
  }

  if (typeof options.variables !== 'object' || options.variables === null) {
    throw new Error(`Invalid variables: '${options.variables}', must be an object`);
  }

  return { variables: options.variables };
}

/**
 * Analyzing code with acorn
 */
export function proceed(code: string): string {
  console.log('proceeding...');
  const dirvBlocks: DirvBlock[] = [];
  acorn.parse(code, {
    ecmaVersion: 'latest',
    // locations: true, // & When locations is true, onComment will receive startLoc, endLoc. But it is useless here
    onComment(isBlock, text, start, end) {
      // & Only allows block comments like `/* #if ... */`, `// #if` is ignored
      if (!isBlock) {
        return;
      }

      const baseDirvBlock = toBaseDirvBlockOrNull(context, text.trim());
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
 * Apply the transformations to the code
 * - detects empty blocks and give a warning message
 */
function apply(ifBlocks: IfNode[]): string {
  return '';
}
