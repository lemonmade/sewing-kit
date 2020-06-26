import {paramCase} from 'change-case';
import {Project, Package, WebApp, Service} from '@sewing-kit/model';

type TypeOrCreator<Type, ProjectType> = Type | ((project: ProjectType) => Type);

export function projectTypeSwitch<
  PackageReturn = undefined,
  WebAppReturn = undefined,
  ServiceReturn = undefined
>(
  project: Project,
  {
    package: pkg,
    webApp,
    service,
  }: {
    package?: TypeOrCreator<PackageReturn, Package>;
    webApp?: TypeOrCreator<WebAppReturn, WebApp>;
    service?: TypeOrCreator<ServiceReturn, Service>;
  },
) {
  if (project instanceof Package) {
    return typeof pkg === 'function' ? (pkg as any)(project) : pkg;
  } else if (project instanceof WebApp) {
    return typeof webApp === 'function' ? (webApp as any)(project) : webApp;
  } else if (project instanceof Service) {
    return typeof service === 'function' ? (service as any)(project) : service;
  }
}

export function toArgs(flags: object, {dasherize = false, json = true} = {}) {
  return Object.entries(flags).reduce<string[]>((all, [key, value]) => {
    const newArgs: string[] = [];
    const normalizedKey = dasherize ? paramCase(key) : key;

    if (typeof value === 'boolean') {
      if (value) {
        newArgs.push(`--${normalizedKey}`);
      }
    } else if (Array.isArray(value)) {
      newArgs.push(
        ...value.flatMap((subValue) => [
          `--${normalizedKey}`,
          String(subValue),
        ]),
      );
    } else if (value != null) {
      if (typeof value === 'object' && json) {
        newArgs.push(`--${normalizedKey}`, JSON.stringify(value));
      } else {
        newArgs.push(`--${normalizedKey}`, String(value));
      }
    }

    return [...all, ...newArgs];
  }, []);
}

export function addHooks<T>(
  adder: () => T,
): <Hooks extends Partial<T>>(hooks: Hooks) => Hooks & T {
  return (hooks) => ({...hooks, ...adder()});
}

export type ValueOrArray<Value> = Value | Value[];
export type ValueOrGetter<Value, Args extends any[] = []> =
  | Value
  | ((...args: Args) => Value | Promise<Value>);

export function unwrapPossibleGetter<T, Args extends any[] = []>(
  maybeGetter: ValueOrGetter<T, Args>,
  ...args: Args
): T | Promise<T> {
  return typeof maybeGetter === 'function'
    ? (maybeGetter as any)(...args)
    : maybeGetter;
}

export async function unwrapPossibleArrayGetter<T, Args extends any[] = []>(
  maybeGetter: ValueOrGetter<ValueOrArray<T>, Args>,
  ...args: Args
) {
  const result = await unwrapPossibleGetter(maybeGetter, ...args);
  return Array.isArray(result) ? result : [result];
}
