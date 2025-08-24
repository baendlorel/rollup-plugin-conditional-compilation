import { Options as AcornOptions } from 'acorn';
import { Dirv } from './consts/directives.ts';

declare global {
  // type IsSameType<A, B> = A extends B ? (B extends A ? true : never) : never;
  type IsSameType<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

  interface __OPTS__ {
    variables: Record<string, any>;
    ecmaVersion: AcornOptions['ecmaVersion'];
    sourceType: AcornOptions['sourceType'];
  }

  interface DirvBlock {
    dirv: Dirv;

    /**
     * Stores indexes in `blocks[]` with directives as keys
     * - in the same `if` group, everyone shares the same `indexes` object
     */
    indexes: DirvBlockIndexes;

    /**
     * if `dirv` is `Dirv.Elif`, `indexes.elif[elifIndex]` is itself
     * - other directives, it will be `-1`
     */
    elifIndex: number;

    /**
     * Condition expression
     * - `boolean` when `dirv` is 'if' or 'elif'
     * - other directive types have `null`
     */
    condition: boolean | null;

    /**
     * Comes from the hook `onComment` in  `acorn.parse`
     */
    start: number;

    /**
     * Comes from the hook `onComment` in  `acorn.parse`
     */
    end: number;
  }

  interface DirvBlockIndexes {
    if: number;
    elif: number[];
    else: number;
    endif: number;
  }

  type IndexlessDirvBlock = Omit<DirvBlock, 'indexes' | 'elifIndex'>;
  type MinimalDirvBlock = Omit<IndexlessDirvBlock, 'start' | 'end'>;
}
