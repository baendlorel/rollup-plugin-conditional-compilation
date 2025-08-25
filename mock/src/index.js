// Entry file for testing
console.log(greet('World'));

/* Single-line comment: variable declaration */
let x = 42; // This is a number variable

/* Multi-line comment: function declaration */
function greet(name) {
  // Function body comment
  return `Hello, ${name}!`;
}

// Arrow function
const add = (a, b) => a + b; // Sum

/**
 * Multi-line comment: class declaration
 * Includes constructor and methods
 */
class Person {
  /**
   * Constructor
   */
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // Method comment
  sayHi() {
    return `Hi, I'm ${this.name}`;
  }
}

// if statement
if (x > 10) {
  // Condition met
  x--;
} else {
  // Condition not met
  x++;
}

// for loop
for (let i = 0; i < 3; i++) {
  /* Loop body comment */
  console.log(i);
}

// while loop
let count = 0;
while (count < 2) {
  // Loop comment
  count++;
}

// switch statement
switch (x) {
  case 41:
    // case 41
    break;
  default:
    // default case
    break;
}

// try-catch-finally
try {
  throw new Error('Test error');
} catch (e) {
  // Error handling
  console.error(e);
} finally {
  // Final execution
}

// Export and import (for syntax testing only, not actually running)
// import { something } from './some-module';
// export const value = 123;

/*
  Complex multi-line comment
  Used to test the comment handling capability of the plugin
*/
