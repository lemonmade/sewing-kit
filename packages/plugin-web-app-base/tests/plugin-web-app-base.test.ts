import {withWorkspace as withBaseWorkspace} from '../../../tests/utilities';

const withWorkspace = withBaseWorkspace.extend(async (workspace) => {
  await workspace.writeConfig(`
    import {createWorkspace} from '@sewing-kit/config';

    import babel from '@sewing-kit/plugin-babel';
    import json from '@sewing-kit/plugin-json';
    import javascript from '@sewing-kit/plugin-javascript';
    import webpack from '@sewing-kit/plugin-webpack';
    import webAppBase from '@sewing-kit/plugin-web-app-base';

    export default createWorkspace((workspace) => {
      workspace.plugin(babel, webpack, javascript, json, webAppBase);
    });
  `);
});

describe('@sewing-kit/plugin-web-app-base', () => {
  it('builds an app in /app', async () => {
    await withWorkspace('simple-client', async (workspace) => {
      await workspace.writeFile(
        'app/browser/index.js',
        `
          function main(message) {
            console.log(message);
          }
          main('Hello, world!');
        `,
      );

      await workspace.run('build');

      expect(await workspace.contents('build/browser/main.js')).toContain(
        'function main(message) {',
      );
    });
  });
});
