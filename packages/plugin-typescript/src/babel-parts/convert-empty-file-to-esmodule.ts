import type * as Types from '@babel/types';
import type {NodePath} from '@babel/traverse';

// @see https://github.com/Shopify/sewing-kit/blob/1c5e7acd53786fa7530c60e3d9cdeb39e9433896/packages/babel-plugin-convert-empty-typescript-file-to-es-module/src/index.ts
export default function convertEmptyTypeScriptFileToESModule({
  types: t,
}: {
  types: typeof Types;
}) {
  return {
    name: 'convert-empty-typescript-file-to-es-module',
    visitor: {
      Program(program: NodePath<Types.Program>, plugin: {filename: string}) {
        const {body} = program.node;
        if (body.length === 0 && hasTypeScriptExtension(plugin)) {
          const esExport = t.exportNamedDeclaration(
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier('__typescript_es_module_faker__'),
                t.stringLiteral(
                  'This export is injected into TypeScript files containing only types.\n' +
                    'It signals to webpack that this is a side-effect free ES module.\n' +
                    'It should *never* appear in optimized production builds.',
                ),
              ),
            ]),
            [],
          );

          body.push(esExport);
        }
      },
    },
  };
}

function hasTypeScriptExtension({filename}: {filename?: string}) {
  return filename?.endsWith('.ts') ?? filename?.endsWith('.tsx') ?? false;
}
