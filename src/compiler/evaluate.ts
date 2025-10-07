/**
 * ## This is the most imaginative part of the whole project
 * - left variables assignment and calculation to `new Function`
 *   - there is no way to be more precise and simple
 * - this makes the expression is evaluated under JavaScript Syntax
 */
export function evaluate(variables: Record<any, any>, expr: string): boolean {
  const fn = new Function(...variables.keys, `return (${expr})`);
  try {
    const result = fn(...variables.values);
    return Boolean(result);
  } catch (e) {
    throw new Error(`"${expr}" with error ${e instanceof Error ? e.message : e}`);
  }
}
