import type { Plugin } from 'rollup';
import { RollupConditionalCompilationOptions } from '@/types/common.js';
import { IfParser } from './parser.js';
import { createSourceMap } from './sourcemap.js';

/**
 * ## Usage
 * Using `// #if` and `// #endif` to do the conditional compilation like C++!
 * @param options options of the plugin
 *
 * __PKG_INFO__
 */
export function conditionalCompilation(
  options: Partial<RollupConditionalCompilationOptions> = {}
): Plugin {
  const opts = normalize(options);
  const parser = new IfParser(opts);

  return {
    name: '__KEBAB_NAME__',
    transform(code: string, id: string) {
      try {
        const result = parser.proceed(code);
        
        // If no conditional compilation directives found, return null
        if (!result) {
          return null;
        }

        // Generate sourcemap for the transformed code
        const map = createSourceMap(code, result.keptRanges, {
          filename: id,
        });

        return {
          code: result.code,
          map,
        };
      } catch (error) {
        console.error('parsing error occured:', error);
        this.error(`error in ${id} - ${error instanceof Error ? error.message : error}`);
      }
    },
  };
}

function normalize(options: Partial<Opts>): Opts {
  if (typeof options !== 'object' || options === null) {
    throw new Error(`Invalid options: '${options}', must be an object`);
  }

  const { variables = {}, ecmaVersion = 'latest', sourceType = 'module' } = options;

  if (typeof variables !== 'object' || variables === null) {
    throw new Error(`Invalid variables: '${variables}', must be an object`);
  }

  if (!Consts.EcmaVersions.split(',').includes(String(ecmaVersion))) {
    throw new Error(`Invalid ecmaVersion: '${ecmaVersion}', must be one of ${Consts.EcmaVersions}`);
  }

  if (!Consts.SourceType.split(',').includes(sourceType)) {
    throw new Error(`Invalid sourceType: '${ecmaVersion}', must be one of ${Consts.SourceType}`);
  }

  return { variables, ecmaVersion, sourceType };
}
