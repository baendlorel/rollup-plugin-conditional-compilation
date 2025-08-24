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

  interface IfMacroBlock {
    type: Dirv;

    /**
     * Condition expression
     * - `boolean` when `type` is 'if' or 'elif'
     * - other directive types have `null`
     */
    condition: boolean | null;

    start: number;

    end: number;
  }
}
