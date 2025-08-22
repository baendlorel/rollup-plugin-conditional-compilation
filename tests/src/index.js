// 测试入口文件
import { greet } from './utils.js';
console.log(greet('World'));
// 单行注释：变量声明
let x = 42; // 这是一个数字变量

/* 多行注释：函数声明 */
function greet(name) {
  // 函数体注释
  return `Hello, ${name}!`;
}

// 箭头函数
const add = (a, b) => a + b; // 求和

/**
 * 多行注释：类声明
 * 包含构造函数和方法
 */
class Person {
  /**
   * 构造函数
   */
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 方法注释
  sayHi() {
    return `Hi, I'm ${this.name}`;
  }
}

// if 语句
if (x > 10) {
  // 条件成立
  x--;
} else {
  // 条件不成立
  x++;
}

// for 循环
for (let i = 0; i < 3; i++) {
  /* 循环体注释 */
  console.log(i);
}

// while 循环
let count = 0;
while (count < 2) {
  // 循环注释
  count++;
}

// switch 语句
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
  // 错误处理
  console.error(e);
} finally {
  // 最终执行
}

// 导出和导入（仅用于语法测试，不实际运行）
// import { something } from './some-module';
// export const value = 123;

/*
  复杂多行注释
  用于测试插件的注释处理能力
*/
