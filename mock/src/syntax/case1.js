// Error Case 1: Missing endif
const errorCase1 = {};

/* #if ERROR_CASE_1 */
console.log('This if block is never closed');
/* #else */
console.log('This else is also never closed');
// Missing endif here!

export { errorCase1 };
