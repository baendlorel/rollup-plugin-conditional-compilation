/** #if DEBUG */
console.log('Debug mode is enabled');
/** #else */
console.log('Debug mode is disabled');
/** #endif */

/** #if PARENT */
function greet(name) {
  /** #if CHILD */
  return `Hello, ${name}!`;
  /** #else */
  return 'Feature not available.';
  /** #endif */
}

console.log(greet('Alice'));
/** #endif */
