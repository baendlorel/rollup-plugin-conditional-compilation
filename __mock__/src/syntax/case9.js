// Error Case 9: Nested if block missing endif
/* #if OUTER */
console.log('Outer if');
/* #if INNER */
console.log('Inner if');
/* #else */
console.log('Inner else');
// Missing inner endif!
/* #endif */
