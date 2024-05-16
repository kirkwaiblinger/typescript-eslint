import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { isIntrinsicNumberType, unionTypeParts } from 'ts-api-utils';
import type * as ts from 'typescript';

import {
  createRule,
  getConstrainedTypeAtLocation,
  getParserServices,
  getWrappingFixer,
  nullThrows,
} from '../util';

export default createRule({
  name: 'no-index-access-widening-assertion',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce the use of `array.at(i)` over `array[i] as typeof array | undefined`',
    },
    messages: {
      preferArrayAt: 'Forbidden widening assertion of array index access.',
      useArrayAtSuggestion: 'Use `Array#at` instead.',
    },
    hasSuggestions: true,
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();

    function typesAreMutuallyAssignable(a: ts.Type, b: ts.Type): boolean {
      return (
        checker.isTypeAssignableTo(a, b) && checker.isTypeAssignableTo(b, a)
      );
    }

    function isTypeBTheUnionOfTypeAAndUndefined(
      a: ts.Type,
      b: ts.Type,
    ): boolean {
      const nonnullableA = checker.getNonNullableType(a);
      const nonnullableB = checker.getNonNullableType(b);
      if (!typesAreMutuallyAssignable(nonnullableA, nonnullableB)) {
        return false;
      }

      const isBUndefinable = checker.isTypeAssignableTo(
        checker.getUndefinedType(),
        b,
      );
      if (!isBUndefinable) {
        return false;
      }

      const isANullable = checker.isTypeAssignableTo(checker.getNullType(), a);
      const isBNullable = checker.isTypeAssignableTo(checker.getNullType(), b);
      if (isANullable !== isBNullable) {
        return false;
      }

      return true;
    }

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

        const expression = node.expression;
        let memberExpression = expression;
        while (memberExpression.type === AST_NODE_TYPES.ChainExpression) {
          memberExpression = memberExpression.expression;
        }
        if (memberExpression.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        if (!memberExpression.computed || memberExpression.optional) {
          return;
        }

        const index = memberExpression.property;

        const indexType = getConstrainedTypeAtLocation(services, index);
        if (
          !(
            isIntrinsicNumberType(indexType) ||
            unionTypeParts(indexType).every(
              unionPart =>
                unionPart.isNumberLiteral() &&
                Number.isInteger(unionPart.value) &&
                unionPart.value >= 0,
            )
          )
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
          node.typeAnnotation,
        );

        if (!isTypeBTheUnionOfTypeAAndUndefined(elementType, assertedType)) {
          return;
        }

        context.report({
          node,
          messageId: 'preferArrayAt',
          suggest: [
            {
              messageId: 'useArrayAtSuggestion',
              fix: getWrappingFixer({
                sourceCode: context.sourceCode,
                node,
                innerNode: [memberExpression.object, index],
                wrap: (object, index) => `${object}.at(${index})`,
              }),
            },
          ],
        });
      },
    };
  },
});
