import { Options as AcornOptions } from 'acorn';
import { Dirv } from './consts/directives.ts';
import { TransformPluginContext } from 'rollup';

declare global {
  // type IsSameType<A, B> = A extends B ? (B extends A ? true : never) : never;
  type IsSameType<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

  interface Context {
    this: TransformPluginContext;
    options: __STRICT_OPTS__;
  }

  interface __OPTS__ {
    variables?: Record<string, unknown>;
    ecmaVersion?: AcornOptions['ecmaVersion'];
    sourceType?: AcornOptions['sourceType'];
  }

  interface __STRICT_OPTS__ {
    variables: { keys: string[]; values: unknown[] };
    ecmaVersion: AcornOptions['ecmaVersion'];
    sourceType: AcornOptions['sourceType'];
  }

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

    children: D extends Dirv.Endif ? null : IfBlock[];
  }

  type BaseDirvBlock = Omit<DirvBlock, 'start' | 'end'>;

  interface IfBlock {
    if: DirvBlock<Dirv.If>;
    elif: DirvBlock<Dirv.Elif>[];
    else: DirvBlock<Dirv.Else> | null;
    endif: DirvBlock<Dirv.Endif>;
  }
}
