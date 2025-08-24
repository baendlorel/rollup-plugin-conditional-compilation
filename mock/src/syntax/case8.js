// Error Case 8: endif with expression (should be empty)
const errorCase8 = {};

/* #if ERROR_CASE_8 */
console.log('Valid if');
/* #endif INVALID_EXPRESSION */ // ERROR: endif should not have expression

export { errorCase8 };
