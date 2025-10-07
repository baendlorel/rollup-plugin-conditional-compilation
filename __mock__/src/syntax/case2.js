// Error Case 2: Multiple else blocks
const errorCase2 = {};

/* #if ERROR_CASE_2 */
console.log('First condition');
/* #else */
console.log('First else');
/* #else */ // ERROR: Multiple else blocks
console.log('Second else - this should cause error');
/* #endif */

export { errorCase2 };
