/**
 * Some errors used in the parser
 * - powered by `rollup-plugin-const-enum`
 * - `cdcp` means conditional compilation
 */
declare const enum cdcp_error {
  syntax_no_else_or_elif_after_else = 'SyntaxError: Cannot have #else or #elif after #else',
  syntax_no_if_after_else_or_elif = 'SyntaxError: Cannot have #if after #else or #elif',
}

declare const enum cdcp_warning {
  not_enough_blocks = 'Warning: Must have at least 2 directives, got orphaned $0. Ignoring it.',
}
