import {TSESLint} from '@typescript-eslint/experimental-utils';
import {preferPascalCaseEnums} from '../prefer-pascal-case-enums';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

function errorWithName(name: string) {
  return {
    data: {name},
    messageId: 'preferPascalCaseEnums',
  };
}

ruleTester.run('prefer-pascal-case-enums', preferPascalCaseEnums, {
  valid: [
    {
      code: `enum SortOrder {MostRecent, LeastRecent, Newest, Oldest}`,
    },
  ],
  invalid: [
    {
      code: `enum SORTORDER {MostRecent, LeastRecent, Newest, Oldest}`,
      errors: [errorWithName('SORTORDER')],
    },
    {
      code: `enum sortorder {MostRecent, LeastRecent, Newest, Oldest}`,
      errors: [errorWithName('sortorder')],
    },
    {
      code: `enum sort_order {MostRecent, LeastRecent, Newest, Oldest}`,
      errors: [errorWithName('sort_order')],
    },
    {
      code: `enum sortOrder {MostRecent, LeastRecent, Newest, Oldest}`,
      errors: [errorWithName('sortOrder')],
    },
    {
      code: `enum sortOrder {mostRecent, LeastRecent, Newest, Oldest}`,
      errors: [errorWithName('sortOrder'), errorWithName('mostRecent')],
    },
    {
      code: `enum SortOrder {MOSTRECENT, least_recent, Newest, Oldest}`,
      errors: [errorWithName('MOSTRECENT'), errorWithName('least_recent')],
    },
  ],
});