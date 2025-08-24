// Error Case 3: elif after else
const errorCase3 = {};

/* #if ERROR_CASE_3 */
console.log('Initial condition');
/* #else */
console.log('Else block');
/* #elif CONDITION */ // ERROR: elif after else
console.log('This elif should cause error');
/* #endif */

export { errorCase3 };
