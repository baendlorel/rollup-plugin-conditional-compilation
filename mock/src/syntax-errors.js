// File with intentional if syntax errors for testing error handling
const errorCases = {};

// Error 1: Missing endif
/* #if ERROR_CASE_1 */
console.log('This if block is never closed');
/* #else */
console.log('This else is also never closed');
// Missing endif here!

// Error 2: else after else
/* #if ERROR_CASE_2 */
console.log('First condition');
/* #else */
console.log('First else');
/* #else */ // ERROR: Multiple else blocks
console.log('Second else - this should cause error');
/* #endif */

// Error 3: elif after else
/* #if ERROR_CASE_3 */
console.log('Initial condition');
/* #else */
console.log('Else block');
/* #elif SOME_CONDITION */ // ERROR: elif after else
console.log('This elif should cause error');
/* #endif */

// Error 4: endif without matching if
console.log('Some regular code');
/* #endif */ // ERROR: endif without if

// Error 5: else without if
/* #else */ // ERROR: else without if
console.log('Orphaned else');

// Error 6: elif without if
/* #elif CONDITION */ // ERROR: elif without if
console.log('Orphaned elif');

// Error 7: else with expression (should be empty)
/* #if ERROR_CASE_7 */
console.log('Valid if');
/* #else INVALID_EXPRESSION */ // ERROR: else should not have expression
console.log('Invalid else with expression');
/* #endif */

// Error 8: endif with expression (should be empty)
/* #if ERROR_CASE_8 */
console.log('Valid if');
/* #endif INVALID_EXPRESSION */ // ERROR: endif should not have expression

export { errorCases };
