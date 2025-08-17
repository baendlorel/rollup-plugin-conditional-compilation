// @ts-check
import { join } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

export function showBundleSize(distDir) {
  const mapper =
    (maxLen) =>
    ({ file, size }) =>
      `${file.padEnd(maxLen, ' ')} - ${(size / 1024).toFixed(3)} KB`;

  return {
    name: 'show-bundle-size',
    writeBundle() {
      const info = [];
      let maxLen = 0;
      let total = 0;
      readdirSync(join(...distDir)).forEach((file) => {
        try {
          const size = statSync(join(...distDir, file)).size;
          maxLen = Math.max(maxLen, file.length);
          total += size;
          info.push({ file, size });
        } catch (e) {
          this.warn(`${file}: Not found or no permission to read`);
        }
      });

      info.sort((a, b) => a.size - b.size);
      info.push({ file: 'Total', size: total });
      console.log(info.map(mapper(maxLen)).join('\n'));
    },
  };
}
