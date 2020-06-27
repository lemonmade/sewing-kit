import {Runtime, Service, WebApp, Package} from '@sewing-kit/model';
import type {Project} from '@sewing-kit/model';

export class TargetRuntime {
  static fromProject(project: Service | WebApp | Package) {
    if (project instanceof Service) {
      return new TargetRuntime([Runtime.Node]);
    }

    if (project instanceof WebApp) {
      return new TargetRuntime([Runtime.Browser]);
    }

    const runtimes = new Set(project.runtimes ?? []);

    for (const entry of project.entries) {
      if (entry.runtimes) {
        for (const entryRuntime of entry.runtimes) {
          runtimes.add(entryRuntime);
        }
      }
    }

    return new TargetRuntime(runtimes);
  }

  readonly runtimes: Set<Runtime>;

  constructor(runtimes: Iterable<Runtime>) {
    this.runtimes = new Set(runtimes);
  }

  includes(runtime: Runtime) {
    return this.runtimes.has(runtime);
  }
}

export interface Target<Kind extends Project, Options> {
  readonly options: Options;
  readonly project: Kind;
  readonly runtime: TargetRuntime;
}

interface BuilderOptions<Kind extends Project, Options> {
  project: Kind;
  options?: Options[];
  runtime?: TargetRuntime;
  needs?: Iterable<TargetBuilder<Kind, Options>>;
}

export class TargetBuilder<Kind extends Project, Options> {
  readonly default: boolean;
  readonly needs: Set<TargetBuilder<Kind, Options>>;
  readonly project: Kind;
  readonly runtime: TargetRuntime;
  private readonly options: Options[];

  constructor({
    project,
    options,
    needs,
    runtime = TargetRuntime.fromProject(project),
  }: BuilderOptions<Kind, Options>) {
    this.project = project;
    this.runtime = runtime;
    this.default = options == null;
    this.options = options ?? [{} as any];
    this.needs = new Set(needs);
  }

  add(...options: Options[]) {
    return new TargetBuilder({
      project: this.project,
      runtime: this.runtime,
      options: [...this.options, ...options],
    });
  }

  multiply(multiplier: (options: Options) => Options[]) {
    return new TargetBuilder({
      project: this.project,
      runtime: this.runtime,
      options: this.options.map(multiplier).flat(),
    });
  }

  toTargets(): Target<Kind, Options>[] {
    const {project, runtime, options} = this;

    return options.map((options) => ({
      project,
      runtime,
      options,
    }));
  }
}
