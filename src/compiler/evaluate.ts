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
export function evaluate(context: Context, expr: string): boolean {
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
