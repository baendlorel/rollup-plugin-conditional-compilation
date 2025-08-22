import conditionalCompilation from '../dist/index.mjs';

export default {
  input: './src/index.js',
  output: {
    file: './dist/bundle.js',
    format: 'esm',
  },
  plugins: [
    conditionalCompilation({
      variables: { DEBUG: true },
      ecmaVersion: 'latest',
      sourceType: 'module',
    }),
  ],
};
