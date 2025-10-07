# Conditional Compilation

[![npm version](https://img.shields.io/npm/v/rollup-plugin-conditional-compilation.svg)](https://www.npmjs.com/package/rollup-plugin-conditional-compilation) [![npm downloads](http://img.shields.io/npm/dm/rollup-plugin-conditional-compilation.svg)](https://npmcharts.com/compare/rollup-plugin-conditional-compilation,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/rollup-plugin-conditional-compilation?utm_source=github.com&utm_medium=referral&utm_content=Borewit/rollup-plugin-conditional-compilation&utm_campaign=Badge_Grade)

A simple plugin that allows you to include or exclude code blocks based on compile-time conditions. Same as `#if`, `#else`, `#elif` , `#endif` in C/C++, it looks like this:

```typescript
// #if DEBUG
console.log('user', userData); // when DEBUG is false, this line will be removed
// #endif
```

> **Note**: You should modify the plugin options to ensure **NOT to strip comments so quickly**, since we work with them. For example, with `@rollup/plugin-typescript`, set `removeComments: false`.

**More Rollup plugins** you might be interested in:

- [rollup-plugin-const-enum](https://www.npmjs.com/package/rollup-plugin-const-enum): inline your `const enum XXX { ... }` definitions at compile time.
- [rollup-plugin-func-macro](https://www.npmjs.com/package/rollup-plugin-func-macro): replace `__func__` by function name of current block, and `__file__` by file name at compile time.

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

## Installation

```bash
npm install --save-dev rollup-plugin-conditional-compilation
pnpm add -D rollup-plugin-conditional-compilation
```

## Usage (rollup.config.js)

```js
import conditional from 'rollup-plugin-conditional-compilation';
export default {
  ...other configs,
  plugins: [
    typescript({
      ...,
      removeComments: false, // !!IMPORTANT!! Don't strip comments so quickly!
    }),
    conditional({ variables: { DEBUG: false, FEATURE_X: true } })
  ],
};
```

### Syntax

- Single-line directives only: `// #if <expression>`, `// #else`, `// #elif <expression>` and `// #endif`.
- The `<expression>` is evaluated at build time with the keys from `variables` available as identifiers.
  - You can write **literally ANY JavaScript expressions** in it, because it is evaluated as an IIFE (Immediately Invoked Function Expression).
  - Supported directives: `#if`, `#else`, `#elif`, `#endif` (similar to C/C++ style conditional compilation).
- Since it is `if/else` , it follows the syntax of `if/else` statements

### Example

Remove testing methods in your class when compiling for production:

```typescript
class User {
  private name: string;
  private identifier: string;

  // #if DEBUG
  // This method will be removed in production build
  _getTestData() {
    return SomeImportantDataForTesting;
  }
  // #endif
}
```

If `variables.DEBUG === false`, compiled output becomes:

```js
console.log('always');
```

## Behaviors

- **AST Parsing**: Using Acorn with `{ ecmaVersion:"latest" }` to parse the code, so it supports all valid JavaScript syntax.

- **Directive Style**: Only `//` comments are scanned for directives; block comments (`/* ... */`) are ignored.
  - Reason 1: block comments can span multiple lines with `*` ahead and may contain nested comments, making parsing more complex and error-prone.
  - Reason 2: I pursue standardization and simplicity! ✨
- **Precise Evaluation**: Expressions are evaluated with the Function constructor — avoid untrusted expressions and side effects.

## License

MIT
