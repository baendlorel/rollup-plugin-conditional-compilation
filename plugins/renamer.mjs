// @ts-check
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGINAL_FILE_NAME = 'real-name.temp';
const TEMP_NAME = 'kasukabe-tsumugi-temporary-name';

class Renamer {
  constructor(packageJsonPath) {
    this.packageJsonPath = packageJsonPath;
    this.realNamePath = join(import.meta.dirname, ORIGINAL_FILE_NAME);
  }

  read() {
    return readFileSync(this.packageJsonPath, 'utf-8');
  }

  write(content) {
    return writeFileSync(this.packageJsonPath, content, 'utf-8');
  }

  saveRealName(name) {
    writeFileSync(this.realNamePath, name, 'utf-8');
  }

  readRealName() {
    return readFileSync(this.realNamePath, 'utf-8');
  }

  changeName() {
    const precompilation = !existsSync(this.realNamePath);
    const content = this.read();
    if (precompilation) {
      const j = JSON.parse(this.read());
      this.saveRealName(j.name);
      this.write(content.replace(j.name, TEMP_NAME));
    } else {
      const name = this.readRealName();
      rmSync(this.realNamePath);
      this.write(content.replace(TEMP_NAME, name));
    }
  }
}

/**
 * Because Node.js finds the package from current project first,
 * we need to rename the package temporarily to make it search node_modules
 */
const renamer = new Renamer(join(import.meta.dirname, '..', 'package.json'));
export default renamer;
