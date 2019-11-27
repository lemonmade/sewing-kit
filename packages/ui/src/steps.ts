import {Step} from '@sewing-kit/types';

type Skipper = ((skipped: string[]) => boolean) | RegExp;

const defaultSkip = () => false;

export function createStep(run: Step['run']): Step;
export function createStep(
  options: Omit<Step, 'run' | 'skip'> & {skip?: Skipper},
  run?: Step['run'],
): Step;
export function createStep(
  runOrStep: Step['run'] | (Omit<Step, 'run' | 'skip'> & {skip?: Skipper}),
  run?: Step['run'],
): Step {
  return typeof runOrStep === 'function'
    ? {run: runOrStep, skip: defaultSkip}
    : {run, ...normalizeOptions(runOrStep!)};
}

function normalizeOptions({
  skip,
  ...rest
}: Omit<Step, 'run' | 'skip'> & {skip?: Skipper}): Step {
  return {...rest, skip: skip ? normalizeSkip(skip) : defaultSkip};
}

function normalizeSkip(skipper: Skipper) {
  return typeof skipper === 'function'
    ? skipper
    : (skipped: string[]) => skipped.some((skip) => skipper.test(skip));
}
