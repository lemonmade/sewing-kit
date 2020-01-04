import {pascalCase} from 'change-case';
import {TSESTree, AST_NODE_TYPES} from '@typescript-eslint/experimental-utils';
import {createRule} from '../utilities';

export const preferPascalCaseEnums = createRule({
  name: `typescript/${__filename}`,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Pascal case when naming enums.',
      category: 'Stylistic Issues',
      recommended: false,
    },
    messages: {
      preferPascalCaseEnums: `Enum '{{name}}' should use Pascal case.`,
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context) => {
    function report(node: TSESTree.Identifier) {
      const {name} = node;

      context.report({
        node,
        messageId: 'preferPascalCaseEnums',
        data: {name},
      });
    }

    return {
      TSEnumMember({id}) {
        if (id.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (!isPascalCase(id)) {
          report(id);
        }
      },
      TSEnumDeclaration({id}) {
        if (!isPascalCase(id)) {
          report(id);
        }
      },
    };
  },
});

function isPascalCase({name}: TSESTree.Identifier) {
  return name === pascalCase(name);
}
