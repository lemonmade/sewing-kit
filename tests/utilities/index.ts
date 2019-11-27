import 'core-js/features/array/flat';
import 'core-js/features/array/flat-map';

import {resolve, dirname} from 'path';
import {Readable, Writable} from 'stream';

import {
  mkdirp,
  rmdir,
  writeFile,
  readFile,
  pathExists,
  emptyDir,
} from 'fs-extra';
import toTree from 'tree-node-cli';
import {ThenType} from '@shopify/useful-types';

const commandMap = {
  build: () => import('../../packages/cli/src/build').then(({build}) => build),
};

type CommandMap = typeof commandMap;
type CommandType<T extends keyof CommandMap> = ThenType<
  ReturnType<CommandMap[T]>
>;

class TestOutputStream extends Writable {
  private buffer = '';

  _write(buffer: Buffer) {
    this.buffer += buffer.toString();
  }
}

export class Workspace {
  constructor(public readonly root: string) {}

  async run<K extends keyof CommandMap>(command: K, args: string[] = []) {
    const stdout = new TestOutputStream();
    const stderr = new TestOutputStream();
    const stdin = new Readable();

    await (await commandMap[command]())([...args, '--root', this.root], {
      __internal: {stdin, stdout, stderr},
    });
  }

  async writeConfig(contents: string) {
    await writeFile(resolve(this.root, 'sewing-kit.config.js'), contents);
  }

  async writeFile(file: string, contents: string) {
    const path = this.resolvePath(file);
    await mkdirp(dirname(path));
    await writeFile(path, contents);
  }

  contents(file: string) {
    return readFile(this.resolvePath(file), 'utf8');
  }

  contains(file: string) {
    return pathExists(this.resolvePath(file));
  }

  resolvePath(file: string) {
    return resolve(this.root, file);
  }

  debug() {
    // eslint-disable-next-line no-console
    console.log(toTree(this.root, {allFiles: true}));
  }
}

export async function withWorkspace(
  name: string,
  useWorkspace: (workspace: Workspace) => void | Promise<void>,
) {
  const root = resolve(__dirname, '../../tmp');
  const directory = resolve(root, name);
  const workspace = new Workspace(directory);

  try {
    await mkdirp(directory);
    await useWorkspace(workspace);
  } finally {
    await emptyDir(directory);
    await rmdir(directory);
  }
}

withWorkspace.extend = (
  extend: (workspace: Workspace) => void | Promise<void>,
) => {
  return (
    name: string,
    useWorkspace: (workspace: Workspace) => void | Promise<void>,
  ) => {
    return withWorkspace(name, async (workspace: Workspace) => {
      await extend(workspace);
      await useWorkspace(workspace);
    });
  };
};
