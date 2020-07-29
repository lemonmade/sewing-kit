import {checkForPluginPresetMatch} from '../utilities';

describe('checkForPluginPresetMatch', () => {
  it('checks to see if an existing plugin matches a list of plugins', () => {
    const pluginName = 'babble/some-plugin';

    expect(checkForPluginPresetMatch([pluginName], pluginName)).toBe(true);
  });

  it('does not match a plugin name that is a substring of another plugin name', () => {
    const pluginName = 'babble/some-plugin';
    const pluginNameSuffixed = 'babble/some-plugin-other';
    const pluginNamePrefixed = 'bibblebabble/some-plugin';

    expect(checkForPluginPresetMatch([pluginName], pluginNameSuffixed)).toBe(
      false,
    );
    expect(checkForPluginPresetMatch([pluginNameSuffixed], pluginName)).toBe(
      false,
    );
    expect(checkForPluginPresetMatch([pluginName], pluginNamePrefixed)).toBe(
      false,
    );
    expect(checkForPluginPresetMatch([pluginNamePrefixed], pluginName)).toBe(
      false,
    );
  });

  it('matches a plugin name to a plugin path', () => {
    const pluginName = 'babble/some-plugin';
    const pluginPathWithIndex = `/Users/test-user/a/bunch/of/folders/${pluginName}/lib/index.js`;
    const pluginPathWithoutIndex = `/Users/test-user/a/bunch/of/folders/${pluginName}.js`;

    expect(checkForPluginPresetMatch([pluginPathWithIndex], pluginName)).toBe(
      true,
    );
    expect(checkForPluginPresetMatch([pluginName], pluginPathWithIndex)).toBe(
      true,
    );
    expect(
      checkForPluginPresetMatch([pluginPathWithoutIndex], pluginName),
    ).toBe(true);
    expect(
      checkForPluginPresetMatch([pluginName], pluginPathWithoutIndex),
    ).toBe(true);
  });
});
