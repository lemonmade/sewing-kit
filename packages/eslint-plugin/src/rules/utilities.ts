import {parse, join} from 'path';
import {ESLintUtils} from '@typescript-eslint/experimental-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PACKAGE_JSON = require('../../package.json');

const REPO = getRepoFromPackageJson(PACKAGE_JSON);

export const createRule = ESLintUtils.RuleCreator((name) => {
  const ruleName = parse(name).name;
  return `${REPO}/blob/v${PACKAGE_JSON.version}/docs/rules/${ruleName}.md`;
});

function getRepoFromPackageJson(pkg: any) {
  const repoPathParts = parse(pkg.repository.url);

  return join(repoPathParts.dir, repoPathParts.name, pkg.repositoroy.directory);
}
