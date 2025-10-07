// Edge case: else after multiple elif with same conditions
// #if VAL === 1
console.log('one');
// #elif VAL === 2
console.log('two');
// #elif VAL === 3
console.log('three');
// #elif VAL === 4
console.log('four');
// #elif VAL === 5
console.log('five');
// #else
console.log('other');
// #endif

// Nested elif with multiple branches at each level
// #if OUTER
console.log('outer-start');
// #if INNER_A
console.log('inner-a');
// #elif INNER_B
console.log('inner-b');
// #elif INNER_C
console.log('inner-c');
// #else
console.log('inner-default');
// #endif
console.log('outer-middle');
// #if SECOND_A
console.log('second-a');
// #elif SECOND_B
console.log('second-b');
// #else
console.log('second-default');
// #endif
console.log('outer-end');
// #elif OUTER_ALT
console.log('outer-alt');
// #else
console.log('outer-default');
// #endif

console.log('done14');
