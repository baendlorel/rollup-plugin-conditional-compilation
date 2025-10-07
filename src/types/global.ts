export interface RollupConditionalCompilationOptions {
  variables: Record<string, unknown>;
}

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

  interface DirvBlock<D extends Dirv = Dirv> {
    dirv: D;
    condition: D extends Dirv.Endif ? null : boolean;
    start: number;
    end: number;
  }
}
