import { Dirv } from '@/consts/directives.js';

export function isIf(block: DirvBlock): block is DirvBlock<Dirv.If> {
  return block.dirv === Dirv.If;
}

export function isElif(block: DirvBlock): block is DirvBlock<Dirv.Elif> {
  return block.dirv === Dirv.Elif;
}

export function isElse(block: DirvBlock): block is DirvBlock<Dirv.Else> {
  return block.dirv === Dirv.Else;
}

export function isEndif(block: DirvBlock): block is DirvBlock<Dirv.Endif> {
  return block.dirv === Dirv.Endif;
}

export function fromElseToElif(block: DirvBlock<Dirv.Else>): DirvBlock<Dirv.Elif> {
  return {
    ...block,
    dirv: Dirv.Elif,
    condition: true,
  };
}
