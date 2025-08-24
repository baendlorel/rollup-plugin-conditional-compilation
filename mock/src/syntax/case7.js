// Error Case 7: else with expression (should be empty)
const errorCase7 = {};

/* #if ERROR_CASE_7 */
console.log('Valid if');
/* #else INVALID_EXPRESSION */ // ERROR: else should not have expression
console.log('Invalid else with expression');
/* #endif */

export { errorCase7 };
