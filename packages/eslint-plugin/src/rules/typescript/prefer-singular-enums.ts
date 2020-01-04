import pluralize from 'pluralize';
import {createRule} from '../utilities';

export const preferSingularEnums = createRule({
  name: `typescript/${__filename}`,
  meta: {
    type: 'problem',
    docs: {
      description: 'Prefer singular TypeScript enums.',
      category: 'Stylistic Issues',
      recommended: false,
    },
    messages: {
      preferSingularEnums: `Enum '{{name}}' should be singular.`,
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => ({
    TSEnumDeclaration(node) {
      const {
        id: {name},
      } = node;

      if (pluralize.isSingular(name)) {
        return;
      }

      context.report({
        node,
        messageId: 'preferSingularEnums',
        data: {name},
      });
    },
  }),
});
