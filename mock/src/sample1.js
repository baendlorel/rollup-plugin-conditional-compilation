/** #if PARENT */
const a = 3;
/** #else */
function greet(name) {
  /** #if CHILD */
  return `Hello, ${name}!`;
  /** #else */
  return 'Feature not available.';
  /** #endif */
}
console.log(greet('Alice'));
/** #endif */
