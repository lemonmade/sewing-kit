import {AsyncSeriesWaterfallHook} from 'tapable';
import {createStep, DiagnosticError} from '@sewing-kit/ui';
import {addHooks, compose} from '@sewing-kit/plugin-utilities';
import {PLUGIN} from './common';

declare module '@sewing-kit/types' {
  interface TypeCheckRootConfigurationCustomHooks {
    typescriptHeap: AsyncSeriesWaterfallHook<number>;
  }
}

export default function typeCheckTypeScript({
  hooks,
}: import('@sewing-kit/core').TypeCheckTask) {
  hooks.configure.tap(
    PLUGIN,
    compose(
      addHooks(() => ({
        typescriptHeap: new AsyncSeriesWaterfallHook(['heap']),
      })),
    ),
  );

  hooks.steps.tap(PLUGIN, (steps, {configuration}) => [
    ...steps,
    createStep({label: 'Type checking with TypeScript'}, async (step) => {
      const heap = await configuration.typescriptHeap!.promise(0);
      const heapArguments = heap ? [`--max-old-space-size=${heap}`] : [];

      try {
        await step.exec(
          'node',
          [...heapArguments, 'node_modules/.bin/tsc', '--build', '--pretty'],
          {env: {FORCE_COLOR: '1'}},
        );
      } catch (error) {
        throw new DiagnosticError({
          title: 'TypeScript found type errors',
          content: error.all,
        });
      }
    }),
  ]);
}
