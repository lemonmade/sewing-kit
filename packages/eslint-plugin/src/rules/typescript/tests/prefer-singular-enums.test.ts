import {TSESLint} from '@typescript-eslint/experimental-utils';
import {preferSingularEnums} from '../prefer-singular-enums';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

function errorWithName(name: string) {
  return {
    data: {name},
    messageId: 'preferSingularEnums' as 'preferSingularEnums',
  };
}

ruleTester.run('prefer-singular-enums', preferSingularEnums, {
  valid: [
    {
      code: `enum SortOrder {MostRecent, LeastRecent, Newest, Oldest}`,
    },
    {
      code: `enum Command {Up, Down}`,
    },
    {
      code: `enum Page {Products, Orders}`,
    },
  ],
  invalid: [
    {
      code: `enum SortOrders {MostRecent, LeastRecent, Newest, Oldest}`,
      errors: [errorWithName('SortOrders')],
    },
    {
      code: `enum Commands {Up, Down}`,
      errors: [errorWithName('Commands')],
    },
    {
      code: `enum Pages {Products, Orders}`,
      errors: [errorWithName('Pages')],
    },
    {
      code: `enum Feet {Left, Right}`,
      errors: [errorWithName('Feet')],
    },

    {
      code: `enum People {}`,
      errors: [errorWithName('People')],
    },
    {
      code: `enum Children {}`,
      errors: [errorWithName('Children')],
    },
  ],
});
