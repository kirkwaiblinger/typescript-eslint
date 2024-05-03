import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { isIntrinsicNumberType } from 'ts-api-utils';

import {
  createRule,
  getConstrainedTypeAtLocation,
  getParserServices,
  nullThrows,
} from '../util';

export default createRule({
  name: 'prefer-array-at',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the use of `Array#at` over `Array#[]`',
    },
    messages: {
      preferArrayAt: 'Expected `Array#at` instead of `Array#[]`.',
      useArrayAtSuggestion: 'Use `Array#at` instead.',
    },
    hasSuggestions: true,
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();
    return {
      'TSAsExpression, TSTypeAssertion'(
        node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
      ): void {
        // Gameplan - the following conditions must be met in order to flag:
        // 1. The node is a type assertion
        // 2. The expression being asserted on is a (nonoptional?) index access expression
        // 3. The index type is of type number. (maybe prohibit negative literals?)
        // 4. The index access occurs on an array.
        // 5. The type being asserted is a union of undefined and the type of the array's elements.
        //
        // If these conditions are met, we can flag the node, and add a suggestion that
        // 1. removes the type assertion
        // 2. replaces the index access with the at method of the same value

        const { expression, typeAnnotation } = node;
        if (expression.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const memberExpression = expression;
        if (!memberExpression.computed || memberExpression.optional) {
          return;
        }

        const index = memberExpression.property;

        if (typeAnnotation.type !== AST_NODE_TYPES.TSUnionType) {
          return;
        }

        const unionParts = typeAnnotation.types;

        if (unionParts.length !== 2) {
          return;
        }
        let nonUndefinedPart: TSESTree.TypeNode | undefined;
        for (const part of unionParts) {
          if (context.sourceCode.getText(part) !== 'undefined') {
            nonUndefinedPart = part;
          }
        }
        if (nonUndefinedPart == null) {
          return;
        }

        if (
          !isIntrinsicNumberType(getConstrainedTypeAtLocation(services, index))
        ) {
          return;
        }

        const objectType = getConstrainedTypeAtLocation(
          services,
          memberExpression.object,
        );
        if (!checker.isArrayType(objectType)) {
          return;
        }

        const elementType = nullThrows(
          objectType.typeArguments?.[0],
          'Array type must have an element type',
        );

        const assertedType = getConstrainedTypeAtLocation(
          services,
          nonUndefinedPart,
        );

        if (assertedType !== elementType) {
          return;
        }

        context.report({
          node,
          messageId: 'preferArrayAt',
          suggest: [
            {
              messageId: 'useArrayAtSuggestion',
              fix: fixer => {
                const indexText = context.sourceCode.getText(index);
                const objectText = context.sourceCode.getText(
                  memberExpression.object,
                );
                return fixer.replaceText(
                  node,
                  `${objectText}.at(${indexText})`,
                );
              },
            },
          ],
        });
      },
    };
  },
});
