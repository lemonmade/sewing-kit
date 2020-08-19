import {liftRepeatedValueInJSONString} from '../src/plugin-jest';

describe('@sewing-kit/plugin-jest', () => {
  describe('liftRepeatedValueInJSONString()', () => {
    it('replaces all instances of a repeated value with a const', () => {
      const repeatedValue = {key: 'value'};
      const obj = {
        key1: repeatedValue,
        key2: repeatedValue,
        key3: repeatedValue,
      };

      const oldJSONString = JSON.stringify(obj);
      const newJSONString = liftRepeatedValueInJSONString(JSON.stringify(obj), {
        repeatedValue: JSON.stringify(repeatedValue),
      });

      expect(newJSONString).not.toEqual(oldJSONString);
      expect(newJSONString).toEqual(
        `const repeatedValue = {"key":"value"};{"key1":repeatedValue,"key2":repeatedValue,"key3":repeatedValue}`,
      );
    });
  });
});
