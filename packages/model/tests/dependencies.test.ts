import {resolve} from 'path';
import {PackageJson} from '../src/base/dependencies';

const fakeProject = resolve(__dirname, 'project');

jest.mock(
  `/tmp/package.json`,
  () => {
    return {name: 'some-package', dependencies: {dep: '1.0.0'}};
  },
  {virtual: true},
);

describe('PackageJson', () => {
  it('loads a test package.json with dependencies', () => {
    const pkg = PackageJson.load('/tmp');
    expect(pkg).toBeInstanceOf(PackageJson);
    expect(pkg!.name).toMatch('some-package');
    expect(pkg!.dependency('dep')).toBeDefined();
    expect(pkg!.devDependencies).toMatchObject({});
  });

  it('defines a PackageJson object from a given object with devDependencies', () => {
    const json = {
      name: 'test',
      devDependencies: {dep1: 'aDep'},
    };
    const pkg = new PackageJson(json);
    expect(pkg!.name).toMatch('test');
    expect(pkg!.dependencies).toMatchObject({});
    expect(pkg!.devDependency('dep1')).toBe('aDep');
  });
});
