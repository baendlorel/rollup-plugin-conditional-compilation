// Error Case 4: endif without matching if
const errorCase4 = {};

console.log('Some regular code');
/* #endif */ // ERROR: endif without if

export { errorCase4 };
