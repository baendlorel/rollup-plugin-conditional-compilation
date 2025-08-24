import * as acorn from 'acorn';
import type { Plugin, TransformPluginContext } from 'rollup';
import { Dirv } from '../consts/directives.js';
import { normalize } from './normalizer.js';

const IF_MACRO_REGEX = new RegExp(`^(${Dirv.If}|${Dirv.Else}|${Dirv.Elif}|${Dirv.Endif})\\b`);
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
  console.log('proceeding...');
  const indexlessBlocks: IndexlessDirvBlock[] = [];
  acorn.parse(code, {
    ecmaVersion: options.ecmaVersion,
    sourceType: options.sourceType,
    // locations: true, // & When locations is true, onComment will receive startLoc, endLoc. But it is useless here
    onComment(isBlock, text, start, end) {
      if (!isBlock) {
        return;
      }

      const minimalDirvBlock = parse(text.trim());
      if (!minimalDirvBlock) {
        return;
      }

      indexlessBlocks.push(Object.assign({ start, end }, minimalDirvBlock));
    },
  });
  toIfBlock(indexlessBlocks);

  return '';
}

/**
 * Parse the comment to a `IfMacroBlock`
 * @param text trimmed comment text
 * @returns `null` when the comment is not a `if` macro
 * @throws when the syntax is invalid
 */
function parse(text: string): MinimalDirvBlock | null {
  text = text.replace(/(^|\n)[*\s]+/g, '');
  let dirv: Dirv | null = null;
  const expr = text
    .replace(IF_MACRO_REGEX, (_, $1: Dirv) => {
      dirv = $1;
      console.log('test', `[${$1}]`);
      return '';
    })
    .trim();

  if (dirv === null) {
    return null;
  }

  if ((dirv === Dirv.Else || dirv === Dirv.Endif) && expr !== '') {
    error(`'${dirv}' should not have any expression, but got: "${expr}"`);
  }

  return {
    dirv,
    condition: evaluate(expr),
  };
}

function evaluate(expr: string): boolean {
  return false;
}

/**
 * Check whether the normal `if` syntax is correct and add `indexes` to each `IfBlock`
 *
 * rule: must match if → (elif)* → (else)? → endif, * and ? here are the same as they are in regex
 * @param indexlessBlocks
 * @throws
 */
function toIfBlock(indexlessBlocks: IndexlessDirvBlock[]): DirvBlock[] {
  // [INFO] the nesting of `if` block is "isomorphic" to a recursive function call

  if (indexlessBlocks.length === 0) {
    return [];
  }

  if (indexlessBlocks.length === 1) {
    error(`Must have at least 2 directives`);
  }

  if (indexlessBlocks[0].dirv !== Dirv.If) {
    error(`The first directive must be '${Dirv.If}'`);
  }

  const blocks: DirvBlock[] = [];

  // & now we have at least 2 directives, and the first one is '#if'
  const iter = (startIndex: number): void => {
    const indexes: DirvBlockIndexes = blocks[startIndex].indexes;

    let hasElse = false;
    for (let i = startIndex + 1; i < indexlessBlocks.length; i++) {
      const indexData: Pick<DirvBlock, 'indexes' | 'elifIndex'> = {
        indexes,
        elifIndex: -1,
      };
      const b: DirvBlock = Object.assign(indexData, indexlessBlocks[i]);

      switch (b.dirv) {
        case Dirv.If:
          iter(i);
          break;
        case Dirv.Elif:
          if (hasElse) {
            error(`'${Dirv.Elif}' cannot appear after '${Dirv.Else}'`);
          }
          indexes.elif.push(i);
          break;
        case Dirv.Else:
          if (hasElse) {
            error(`Multiple '${Dirv.Else}' in the same 'if' block`);
          }
          hasElse = true;
          indexes.else = i;
          break;
        case Dirv.Endif:
          indexes.endif = i;
          return; // closed with endif, if the syntax is correct, checker should return here
      }
    }

    // not end with endif
    error(`'${Dirv.Endif}' is missing`);
  };

  iter(0);
}

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
