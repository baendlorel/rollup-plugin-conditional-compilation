export interface RollupConditionalCompilationOptions {
  variables: Record<string, unknown>;
}

declare global {
  // Basic directives, act like they are in C++
  const enum Dirv {
    If = '#if',
    Else = '#else',
    Elif = '#elif',
    Endif = '#endif',
  }

  type RollupConditionalCompilationOption = RollupConditionalCompilationOptions;

  interface DirvBlock<D extends Dirv = Dirv> {
    dirv: D;

    /**
     * Condition expression
     * - `boolean` when `dirv` is 'if' or 'elif'
     * - other directive types have `null`
     */
    condition: D extends Dirv.Endif | Dirv.Else ? null : boolean;

    /**
     * Comes from the hook `onComment` in  `acorn.parse`
     */
    start: number;

    /**
     * Comes from the hook `onComment` in  `acorn.parse`
     */
    end: number;
  }

  type BaseDirvBlock = Omit<DirvBlock, 'start' | 'end'>;

  interface IfNode {
    dirv: Dirv;
    /**
     * [NOTE] We can merge the same logic together because:
     * - when applying, `#if` uses the same logic as `#elif` (both check the condition to include or not)
     * - `#else` is equivalent to `#elif true`
     */
    condition?: boolean;

    next?: IfNode;

    children?: IfNode[];

    start: number;

    end: number;
  }
}
