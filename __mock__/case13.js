// Adjacent elif blocks without separation
// #if A
console.log('block1-a');
// #endif
// #if B
console.log('block2-b');
// #elif C
console.log('block2-c');
// #endif
// #if D
console.log('block3-d');
// #elif E
console.log('block3-e');
// #elif F
console.log('block3-f');
// #else
console.log('block3-none');
// #endif

// Extreme nesting: 4 levels deep with elif at each level
// #if L1
console.log('L1');
// #if L2
console.log('L2');
// #if L3
console.log('L3');
// #if L4
console.log('L4-deepest');
// #elif L4_ALT
console.log('L4-alt');
// #endif
// #elif L3_ALT
console.log('L3-alt');
// #endif
// #elif L2_ALT
console.log('L2-alt');
// #endif
// #elif L1_ALT
console.log('L1-alt');
// #endif

console.log('done13');
