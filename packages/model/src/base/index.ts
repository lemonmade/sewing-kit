import {FileSystem} from './fs';
import {PackageJson} from './dependencies';

export interface Options {
  readonly name: string;
  readonly root: string;
}

export interface DependencyOptions {
  all?: boolean;
  dev?: boolean;
  prod?: boolean;
}

export class Base {
  readonly name: string;
  readonly root: string;
  readonly fs: FileSystem;
  protected readonly packageJson?: PackageJson;

  constructor({name, root}: Options) {
    this.name = name;
    this.root = root;
    this.fs = new FileSystem(root);
    this.packageJson = PackageJson.load(this.root);
  }

  dependencies({prod = true, dev, all}: DependencyOptions = {}) {
    const dependencies: string[] = [];

    if (this.packageJson == null) {
      return dependencies;
    }

    if (prod || all) {
      dependencies.push(...Object.keys(this.packageJson.dependencies));
    }

    if (dev || all) {
      dependencies.push(...Object.keys(this.packageJson.devDependencies));
    }

    return dependencies;
  }

  async hasDependency(
    name: string,
    _options?: DependencyOptions & {version?: string},
  ): Promise<boolean> {
    const {packageJson} = this;

    return packageJson != null && packageJson.dependency(name) != null;
  }
}
