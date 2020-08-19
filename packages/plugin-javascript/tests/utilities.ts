import {statSync as stat} from 'fs';

import {Workspace} from '../../../tests/utilities';
import {Package} from '@sewing-kit/plugins';

export function getModifiedTime(filepath: string) {
  return stat(filepath).mtimeMs;
}

export async function writeToSrc(workspace: Workspace, filepath: string) {
  await workspace.writeFile(
    `src/${filepath}`,
    `export function pkg(greet) { console.log(\`Hello, \${greet}!\`); }`,
  );
}

export function createTestPackage(workspace: Workspace) {
  return new Package({name: 'simple-package', root: workspace.root});
}
