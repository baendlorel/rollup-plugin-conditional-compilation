export interface RollupConditionalCompilationOptions {
  variables: Record<string, unknown>;
}

type l = RollupConditionalCompilationOptions;
declare global {
  type Opts = l;

  // Basic directives, act like they are in C++
  const enum Dirv {
    If = '#if',
    // Else = '#else',
    // Elif = '#elif',
    Endif = '#endif',
  }

  interface IfBlock {
    condition: boolean;
    start: number;
    end: number;
    children: IfBlock[];
  }

  interface DirvBlock {
    dirv: Dirv;
    condition: boolean | null;
    start: number;
    end: number;
  }
}
