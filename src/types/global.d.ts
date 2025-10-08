import { RollupConditionalCompilationOptions } from './common.js';

declare global {
  type Opts = RollupConditionalCompilationOptions;

  const enum Consts {
    EcmaVersions = '3,5,6,7,8,9,10,11,12,13,14,15,16,17,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,latest',
    SourceType = 'script,module',
  }

  // Basic directives, act like they are in C++
  const enum Dirv {
    If = '#if',
    Else = '#else',
    Elif = '#elif',
    Endif = '#endif',
  }

  interface IfBlock {
    dirv: Dirv;
    condition: boolean | null;
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
