// const enum Dirv {
//   If = '#if',
//   // Else = '#else',
//   // Elif = '#elif',
//   Endif = '#endif',
// }

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

Reflect.set(globalThis, 'Dirv', {
  If: '#if',
  Else: '#else',
  Elif: '#elif',
  Endif: '#endif',
});

Reflect.set(globalThis, 'loadjs', (name: string) =>
  readFileSync(join(process.cwd(), '__mock__', name), 'utf-8')
);

declare global {
  function loadjs(name: string): string;
}
