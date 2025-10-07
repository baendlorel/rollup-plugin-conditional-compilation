// Complex expressions in elif
// #if A > 10
console.log('a-large');
// #elif A > 5
console.log('a-medium');
// #elif A > 0
console.log('a-small');
// #else
console.log('a-nonpositive');
// #endif

// Logical operators in elif chains
// #if X && Y
console.log('xy-both');
// #elif X || Y
console.log('xy-either');
// #elif !X && !Y
console.log('xy-neither');
// #else
console.log('xy-unknown');
// #endif

// Ternary and complex expressions
// #if TYPE === 'prod'
console.log('production');
// #elif TYPE === 'dev'
console.log('development');
// #elif TYPE === 'test'
console.log('testing');
// #else
console.log('unknown-type');
// #endif

console.log('done12');
