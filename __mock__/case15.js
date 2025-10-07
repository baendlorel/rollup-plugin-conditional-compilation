// Error cases: malformed elif/else usage

// Error: unmatched elif
// #elif ORPHAN
console.log('orphan-elif');
// #endif

console.log('done15');
