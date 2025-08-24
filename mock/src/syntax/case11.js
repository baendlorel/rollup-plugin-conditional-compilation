// Error Case 11: Multiple nested else in one block
/* #if A */
console.log('A');
/* #if B */
console.log('B');
/* #else */
console.log('B else');
/* #else */ // ERROR: Multiple else in nested block
console.log('B else again');
/* #endif */
/* #else */
console.log('A else');
/* #endif */
