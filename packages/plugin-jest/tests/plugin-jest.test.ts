import {Package} from '@sewing-kit/plugins';
import {PackageEntryOptions} from '@sewing-kit/model';

import {
  internalPackageEntryMapDict,
  internalPackageDependencyGraph,
  minimalModuleMap,
  moduleMapKey,
} from '../src/plugin-jest';

describe('@sewing-kit/plugin-jest', () => {
  describe('Module map', () => {
    describe('internalPackageEntryMapDict()', () => {
      it('creates a map of internal packages to their resolved entries', () => {
        const pkgs = createMockPackageList([
          {
            name: 'pkg-a',
            deps: [],
            entries: [{root: './entry-a', name: 'entry-a'}],
          },
        ]);

        const pkgMap = internalPackageEntryMapDict(pkgs);

        expect(pkgMap).toHaveProperty('pkg-a');
        expect(pkgMap['pkg-a']).toHaveProperty(moduleMapKey('pkg-a'));
        expect(pkgMap['pkg-a']).toHaveProperty(moduleMapKey('pkg-a/entry-a'));
      });
    });

    describe('minimalModuleMap()', () => {
      it('produces a minimal map of internal module dependencies', () => {
        const pkg = createMockPackage({
          name: 'pkg-a',
          deps: ['pkg-b', 'ext-pkg'],
        });
        const pkgs = [
          pkg,
          ...createMockPackageList([
            {name: 'pkg-b', deps: ['pkg-a']},
            {name: 'pkg-c', deps: ['pkg-b']},
            {name: 'pkg-d', deps: ['pkg-a', 'pkg-b']},
          ]),
        ];

        const pkgMap = internalPackageEntryMapDict(pkgs);
        const depGraph = internalPackageDependencyGraph(pkgs, pkgMap);
        const minMap = minimalModuleMap(pkg, pkgMap, depGraph);

        expect(minMap).toHaveProperty(moduleMapKey('pkg-b'));
        expect(minMap).toHaveProperty(moduleMapKey('pkg-a'));
        expect(minMap).not.toHaveProperty(moduleMapKey('pkg-c'));
        expect(minMap).not.toHaveProperty(moduleMapKey('pkg-d'));
        expect(minMap).not.toHaveProperty(moduleMapKey('ext-pkg'));
      });
    });

    describe('moduleMapKey()', () => {
      it('matches the exact module name', () => {
        const moduleKey = moduleMapKey('pkg-a');
        const keyRegex = new RegExp(moduleKey);

        expect(keyRegex.test('pkg-a')).toBe(true);
      });

      it(`doesn't match other module names`, () => {
        const moduleKey = moduleMapKey('pkg-a');
        const keyRegex = new RegExp(moduleKey);

        expect(keyRegex.test('pkg-a-suffix')).toBe(false);
        expect(keyRegex.test('prefix-pkg-a')).toBe(false);
      });
    });
  });
});

interface MockPackageOptions {
  name: string;
  deps: string[];
  entries?: PackageEntryOptions[];
}

function createMockPackage({
  name,
  deps,
  entries = [],
}: MockPackageOptions): Package {
  const pkg = new Package({
    name,
    root: `package/${name}`,
    entries: [{root: 'index'}, ...entries],
  });

  Object.defineProperty(pkg, 'runtimeName', {
    get: jest.fn(() => name),
  });
  jest.spyOn(pkg, 'dependencies').mockImplementation(() => deps);

  return pkg;
}

function createMockPackageList(packages: MockPackageOptions[]) {
  return packages.map(createMockPackage);
}
