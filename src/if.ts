import * as acorn from 'acorn';
import type { Plugin, TransformPluginContext } from 'rollup';
import { DirvMeta, Dirv } from './directives.js';
import { normalize } from './normalizer.js';

const IF_MACRO_REGEX = new RegExp(`^${DirvMeta.Regex}`);
let warn: TransformPluginContext['warn'] = console.warn;
let error: TransformPluginContext['error'] = (e: unknown) => {
  throw e;
};

let opts: __OPTS__ = {} as __OPTS__;

/**
 * @param options options of the plugin
 *
 * __PKG_INFO__
 *
 */
export function conditionalCompilation(options?: Partial<__OPTS__>): Plugin {
  opts = normalize(options);

  return {
    name: '__KEBAB_NAME__',
    transform(this: TransformPluginContext, code: string, id: string) {
      if (this && typeof this.warn === 'function' && typeof this.error === 'function') {
        warn = this.warn;
        error = this.error;
      }

      try {
        return proceed(code);
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
export function proceed(code: string, options = opts): string {
  console.log('proceeding...' + code.slice(0, 250) + '\n');
  const blocks: IfMacroBlock[] = [];
  acorn.parse(code, {
    ecmaVersion: opts.ecmaVersion,
    sourceType: opts.sourceType,
    // locations: true, // & When locations is true, onComment will receive startLoc, endLoc. But it is useless here
    onComment(isBlock, text, start, end) {
      if (!isBlock) {
        return;
      }

      const parsed = parse(text.trim()) as IfMacroBlock | null;
      if (!parsed) {
        return;
      }

      parsed.start = start;
      parsed.end = end;
      blocks.push(parsed);
    },
  });
  return '';
}

/**
 * Parse the comment to a `IfMacroBlock`
 * @param text trimmed comment text
 * @returns `null` when the comment is not a `if` macro
 * @throws when the syntax is invalid
 */
function parse(text: string): Omit<IfMacroBlock, 'start' | 'end'> | null {
  let type: Dirv | null = null;
  const expr = text.replace(IF_MACRO_REGEX, (_, $1: Dirv) => {
    type = $1;
    return '';
  });
  if (type === null) {
    return null;
  }

  // & Since the text is trimmed and directives is replaced with /\s*/
  // & `expr` is no need to be trimmed again
  if ((type === Dirv.Eles || type === Dirv.Endif) && expr !== '') {
    error(`${type} should not have any expression, but got: "${expr}"`);
  }

  return {
    type,
    condition: evaluate(expr),
  };
}

function evaluate(expr: string): boolean {}

/**
 * 安全地评估表达式
 * @param expression 表达式字符串
 * @param globals 全局变量
 * @returns 表达式结果
 */
function evaluateExpression(expression: string, globals: Record<string, any>): boolean {
  let ast: acorn.Node;
  try {
    ast = acorn.parseExpressionAt(expression, 0, { ecmaVersion: 'latest' });
  } catch (error) {
    throw new Error(`Invalid expression syntax: ${error instanceof Error ? error.message : error}`);
  }

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
