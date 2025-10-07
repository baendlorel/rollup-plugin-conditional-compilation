// Error Case 10: elif with expression after else
/* #if TEST */
console.log('Test if');
/* #else */
console.log('Test else');
/* #elif ANOTHER */ // ERROR: elif after else
console.log('Should not allow elif after else');
/* #endif */
