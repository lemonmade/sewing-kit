import {Step} from './types';

type Skipper = ((skipped: readonly string[]) => boolean) | RegExp;

const defaultSkip = () => false;

export function createStep(run: Step['run']): Step;
export function createStep(
  options: Omit<Step, 'run' | 'skip'> & {skip?: Skipper},
  run: Step['run'],
): Step;
export function createStep(
  runOrStep: Step['run'] | (Omit<Step, 'run' | 'skip'> & {skip?: Skipper}),
  run?: Step['run'],
): Step {
  return typeof runOrStep === 'function'
    ? {run: runOrStep, skip: defaultSkip}
    : {run: run!, ...normalizeOptions(runOrStep!)};
}

function normalizeOptions({
  skip,
  ...rest
}: Omit<Step, 'run' | 'skip'> & {skip?: Skipper}): Omit<Step, 'run'> {
  return {...rest, skip: skip ? normalizeSkip(skip) : defaultSkip};
}

function normalizeSkip(skipper: Skipper) {
  return typeof skipper === 'function'
    ? skipper
    : (skipped: readonly string[]) =>
        skipped.some((skip) => skipper.test(skip));
}
