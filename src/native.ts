export const ObjectIs = Object.is;

/**
 * @returns
 * - `null` if the value is not a number
 * - `true` if the value is `NaN`
 * - `false` if the value is a number and not `NaN`
 */
export const isNaN = (v: unknown) => (typeof v !== 'number' ? null : ObjectIs(v, NaN));
