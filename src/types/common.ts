import * as acorn from 'acorn';

export interface RollupConditionalCompilationOptions {
  /**
   * Variables to be used in the expressions `#if` or `#elif`
   */
  variables: Record<string, unknown>;

  /**
   * Will be passed to Acorn
   * - default: 'module'
   */
  sourceType: 'script' | 'module';

  /**
   * Will be passed to Acorn
   * - default: 'latest'
   */
  ecmaVersion: acorn.ecmaVersion;
}
