import {resolve, join, dirname} from 'path';
import {writeFile, readFile, mkdirp} from 'fs-extra';
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

  async hasFile(file: string) {
    const matches = await this.glob(file, {nodir: true});
    return matches.length > 0;
  }

  async hasDirectory(dir: string) {
    const matches = await this.glob(dir.endsWith('/') ? dir : `${dir}/`);
    return matches.length > 0;
  }

  // eslint-disable-next-line require-await
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

export class SewingKitFileSystem extends FileSystem {
  constructor(projectRoot: string) {
    super(join(projectRoot, '.sewing-kit'));
  }

  configPath(...paths: string[]) {
    return this.resolvePath('config', ...paths);
  }

  cachePath(...paths: string[]) {
    return this.resolvePath('cache', ...paths);
  }

  resolvePath(...paths: string[]) {
    return resolve(this.root, ...paths);
  }
}
