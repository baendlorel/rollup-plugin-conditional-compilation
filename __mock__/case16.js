// Error cases: malformed expression in elif
// #if VALID
console.log('valid');
// #elif (BROKEN &&
console.log('broken-elif');
// #endif

console.log('done16');
