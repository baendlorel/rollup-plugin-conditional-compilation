import { Options as AcornOptions } from 'acorn';
import { Dirv } from './directives.ts';

declare global {
  // type IsSameType<A, B> = A extends B ? (B extends A ? true : never) : never;
  type IsSameType<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

  interface __OPTS__ {
    variables: Record<string, any>;
    ecmaVersion: AcornOptions['ecmaVersion'];
    sourceType: AcornOptions['sourceType'];
  }

  interface Block {
    /**
     * Condition expression
     * - `boolean` when `dirv` is 'if' or 'elif'
     * - other directive types have `null`
     */
    condition: boolean | null;

    start: number;

    end: number;
  }

  interface IfBlockIndexes {
    if: number;
    elif: number[];
    else: number;
    endif: number;
  }

  /**
   * Only directive `#if` has `indexes` property
   */
  type DirvBlock =
    | (Block & {
        dirv: Dirv.If;

        /**
         * Stores indexes in `blocks[]` with directives as keys
         */
        indexes: IfBlockIndexes;
      })
    | (Block & {
        dirv: Dirv.Elif | Dirv.Else | Dirv.Endif;

        /**
         * the index in `blocks[]` of `#if`
         */
        ifIndex: number;
      });

  type IndexlessDirvBlock = Block & { dirv: Dirv };
  type MinimalDirvBlock = Omit<IndexlessDirvBlock, 'start' | 'end'>;
}
