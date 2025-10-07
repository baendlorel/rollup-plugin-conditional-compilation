import * as acorn from 'acorn';

const code = `/// # if true

if(333){
console.log(2);
}

/** 
 * block comment
 */

`;

acorn.parse(code, {
  ecmaVersion: 'latest',
  onComment(isBlock, text, start, end) {
    console.log({ isBlock, text, start, end });
  },
});
