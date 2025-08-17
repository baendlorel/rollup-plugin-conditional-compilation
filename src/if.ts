import { Dirv } from './directives.js';
import * as acorn from 'acorn';
import type { Plugin } from 'rollup';

interface ConditionalCompilationOptions {
  globals?: Record<string, any>;
}

/**
 *
 * @param options options of the plugin
 */
export function conditionalCompilation(options: ConditionalCompilationOptions = {}): Plugin {
  const { globals = {} } = options;

  return {
    name: 'conditional-compilation',
    transform(code: string, id: string) {
      try {
        return processConditionalCompilation(code, globals);
      } catch (error) {
        this.error(
          `Conditional compilation error in ${id}: ${error instanceof Error ? error.message : error}`
        );
      }
    },
  };
}

/**
 * 处理条件编译
 * @param code 源代码
 * @param globals 全局变量
 * @returns 处理后的代码
 */
function processConditionalCompilation(code: string, globals: Record<string, any>): string {
  const lines = code.split('\n');
  const result: string[] = [];
  const stack: { condition: boolean; lineStart: number }[] = [];
  let currentCondition = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 匹配 if 指令：/**#if expression*/
    const ifMatch = trimmed.match(
      new RegExp(`^\\${Dirv.PREFIX}\\s*\\${Dirv.IF}\\s+(.+?)\\s*\\${Dirv.SUFFIX}$`)
    );
    if (ifMatch) {
      const expression = ifMatch[1];
      try {
        const conditionResult = evaluateExpression(expression, globals);
        stack.push({ condition: conditionResult, lineStart: i });
        currentCondition = currentCondition && conditionResult;
        continue; // 不输出 if 指令行
      } catch (error) {
        throw new Error(
          `Failed to evaluate expression "${expression}" at line ${i + 1}: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    // 匹配 endif 指令：/**#endif*/
    const endifMatch = trimmed.match(
      new RegExp(`^\\${Dirv.PREFIX}\\s*\\${Dirv.ENDIF}\\s*\\${Dirv.SUFFIX}$`)
    );
    if (endifMatch) {
      if (stack.length === 0) {
        throw new Error(`Unexpected ${Dirv.ENDIF} at line ${i + 1}: no matching ${Dirv.IF}`);
      }
      stack.pop();
      // 重新计算当前条件
      currentCondition = stack.length === 0 ? true : stack.every((s) => s.condition);
      continue; // 不输出 endif 指令行
    }

    // 如果当前条件为真，则保留代码行
    if (currentCondition) {
      result.push(line);
    }
  }

  // 检查是否有未闭合的 if
  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    throw new Error(`Unclosed ${Dirv.IF} directive starting at line ${unclosed.lineStart + 1}`);
  }

  return result.join('\n');
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
