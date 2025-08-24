/** #if DEBUG */
console.log('Debug mode is enabled');
/** #else */
console.log('Debug mode is disabled');
/** #endif */

function greet(name) {
  /** #if FEATURE_GREET */
  return `Hello, ${name}!`;
  /** #else */
  return 'Feature not available.';
  /** #endif */
}
