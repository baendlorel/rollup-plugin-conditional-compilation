import * as acorn from 'acorn';

export interface RollupConditionalCompilationOptions {
  variables: Record<string, unknown>;
  sourceType: 'script' | 'module';
  ecmaVersion: acorn.ecmaVersion;
}
