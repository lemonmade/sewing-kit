import {PackageJson} from '../dependencies';

describe('PackageJson', () => {
  it('loads the package.json for its own package @sewing-kit/model', () => {
    const pkg = PackageJson.load('../../');
    expect(pkg).toBeInstanceOf(PackageJson);
    expect(pkg!.name).toMatch('@sewing-kit/model');
    expect(pkg!.dependency('glob')).toBeDefined();
    expect(pkg!.devDependencies).toMatchObject({});
  });

  it('defines a PackageJson object from a given object with the expected properties', () => {
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
