import * as acorn from 'acorn';
import type { Plugin } from 'rollup';
import { Dirv } from './directives.js';

/**
 *
 * @param options options of the plugin
 */
export function conditionalCompilation(options: Partial<__OPTS__>): Plugin {
  return {
    name: '__KEBAB_NAME__',
    transform(code: string, id: string) {
      try {
        return proceed(code, globals);
      } catch (error) {
        this.error(
          `__KEBAB_NAME__: error in ${id} - ${error instanceof Error ? error.message : error}`
        );
      }
    },
  };
}

/**
 * Analyzing code with acorn
 * @param code source coude
 * @param globals global variables
 */
function proceed(code: string, globals: Record<string, any>): string {
  const ast = acorn.parse(code, { ecmaVersion: 'latest' });
}

/**
 * 安全地评估表达式
 * @param expression 表达式字符串
 * @param globals 全局变量
 * @returns 表达式结果
 */
function evaluateExpression(expression: string, globals: Record<string, any>): boolean {
  // 解析表达式为 AST
  let ast: acorn.Node;
  try {
    ast = acorn.parseExpressionAt(expression, 0, { ecmaVersion: 'latest' });
  } catch (error) {
    throw new Error(`Invalid expression syntax: ${error instanceof Error ? error.message : error}`);
  }

  // 递归评估 AST 节点
  function evaluate(node: acorn.Node): any {
    switch (node.type) {
      case 'Literal':
        return (node as any).value;

      case 'Identifier':
        const name = (node as any).name;
        if (name in globals) {
          return globals[name];
        }
        throw new Error(`Undefined variable: ${name}`);

      case 'BinaryExpression':
        const binaryNode = node as any;
        const left = evaluate(binaryNode.left);
        const right = evaluate(binaryNode.right);

        switch (binaryNode.operator) {
          case '==':
            return left == right;
          case '===':
            return left === right;
          case '!=':
            return left != right;
          case '!==':
            return left !== right;
          case '<':
            return left < right;
          case '<=':
            return left <= right;
          case '>':
            return left > right;
          case '>=':
            return left >= right;
          case '&&':
            return left && right;
          case '||':
            return left || right;
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          case '%':
            return left % right;
          default:
            throw new Error(`Unsupported binary operator: ${binaryNode.operator}`);
        }

      case 'UnaryExpression':
        const unaryNode = node as any;
        const operand = evaluate(unaryNode.argument);

        switch (unaryNode.operator) {
          case '!':
            return !operand;
          case '-':
            return -operand;
          case '+':
            return +operand;
          default:
            throw new Error(`Unsupported unary operator: ${unaryNode.operator}`);
        }

      case 'LogicalExpression':
        const logicalNode = node as any;
        const leftVal = evaluate(logicalNode.left);

        if (logicalNode.operator === '&&') {
          return leftVal ? evaluate(logicalNode.right) : leftVal;
        } else if (logicalNode.operator === '||') {
          return leftVal ? leftVal : evaluate(logicalNode.right);
        }
        throw new Error(`Unsupported logical operator: ${logicalNode.operator}`);

      case 'ConditionalExpression':
        const condNode = node as any;
        const test = evaluate(condNode.test);
        return test ? evaluate(condNode.consequent) : evaluate(condNode.alternate);

      default:
        throw new Error(`Unsupported expression type: ${node.type}`);
    }
  }

  const result = evaluate(ast);

  // 确保返回布尔值
  return Boolean(result);
}
