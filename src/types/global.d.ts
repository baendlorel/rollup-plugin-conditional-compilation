import { RollupConditionalCompilationOptions } from './common.js';

type l = RollupConditionalCompilationOptions;
declare global {
  type Opts = l;

  // Basic directives, act like they are in C++
  const enum Dirv {
    If = '#if',
    Else = '#else',
    Elif = '#elif',
    Endif = '#endif',
  }

  interface IfBlock {
    condition: boolean;
    ifStart: number;
    ifEnd: number;
    endifStart: number;
    endifEnd: number;
    children: IfBlock[];
  }

  interface DirvBlock {
    dirv: Dirv;

    /**
     * When `dirv` is `#endif`, `condition` is meaningless (always `false`).
     */
    condition: boolean;

    start: number;

    end: number;
  }
}
