import {resolve, dirname} from 'path';

import {
  writeFile,
  readFile,
  mkdirp,
  copy as copyExtra,
  CopyOptions,
} from 'fs-extra';
import glob, {IOptions as GlobOptions} from 'glob';

export class FileSystem {
  constructor(public readonly root: string) {}

  read(file: string) {
    return readFile(this.resolvePath(file), 'utf8');
  }

  async write(file: string, contents: string) {
    const resolved = this.resolvePath(file);
    await mkdirp(dirname(resolved));
    await writeFile(resolved, contents);
  }

  async copy(from: string, to: string, options?: CopyOptions) {
    const resolvedFrom = this.resolvePath(from);
    const resolvedTo = this.resolvePath(to);

    await copyExtra(resolvedFrom, resolvedTo, options);
  }

  async hasFile(file: string) {
    const matches = await this.glob(file, {nodir: true});
    return matches.length > 0;
  }

  async hasDirectory(dir: string) {
    const matches = await this.glob(dir.endsWith('/') ? dir : `${dir}/`);
    return matches.length > 0;
  }

  async glob(pattern: string, options: Omit<GlobOptions, 'cwd'> = {}) {
    return glob.sync(pattern, {...options, cwd: this.root, absolute: true});
  }

  buildPath(...paths: string[]) {
    return this.resolvePath('build', ...paths);
  }

  resolvePath(...paths: string[]) {
    return resolve(this.root, ...paths);
  }
}
