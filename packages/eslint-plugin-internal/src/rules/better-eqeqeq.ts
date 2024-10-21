import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import {
  nullThrows,
  NullThrowsReasons,
} from '@typescript-eslint/utils/eslint-utils';
import type {
  ReportFixFunction,
  RuleFixer,
} from '@typescript-eslint/utils/ts-eslint';

import { createRule } from '../util';

export default createRule({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce eqeqeq standards',
    },
    messages: {
      unexpectedComparison:
        'Unexpected {{operator}} comparison with {{nullishKeyword}}',
      convertToLooseEquality: 'Use loose equality.',
    },
    schema: [],
    fixable: 'code',
    hasSuggestions: true,
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(binaryExpressionNode): void {
        const {
          left: leftChild,
          right: rightChild,
          operator,
        } = binaryExpressionNode;
        switch (operator) {
          case '!==':
          case '===':
            {
              const undefinedChildren = [
                binaryExpressionNode.left,
                binaryExpressionNode.right,
              ].filter(
                child =>
                  child.type === AST_NODE_TYPES.Identifier &&
                  child.name === 'undefined',
              );

              if (undefinedChildren.length > 0) {
                const illegalChild = undefinedChildren[0];
                context.report({
                  node: binaryExpressionNode,
                  data: {
                    nullishKeyword: 'undefined',
                    operator,
                  },
                  messageId: 'unexpectedComparison',
                  ...(undefinedChildren.length === 1 &&
                    (() => {
                      const fix = (
                        fixer: RuleFixer,
                      ): ReturnType<ReportFixFunction> => {
                        return [
                          fixer.replaceText(illegalChild, 'null'),
                          fixer.replaceTextRange(
                            nullThrows(
                              context.sourceCode.getFirstTokenBetween(
                                leftChild,
                                rightChild,
                                token => token.value === operator,
                              ),
                              NullThrowsReasons.MissingToken(
                                operator,
                                'binary expression',
                              ),
                            ).range,
                            operator === '===' ? '==' : '!=',
                          ),
                        ];
                      };
                      if (false as boolean) {
                        return {
                          suggest: [
                            {
                              messageId: 'convertToLooseEquality',
                              fix,
                            } as const,
                          ],
                        };
                      }
                      return {
                        fix,
                      };
                    })()),
                });
              }
            }
            break;

          case '==':
          case '!=':
            {
              const undefinedChildren = [
                binaryExpressionNode.left,
                binaryExpressionNode.right,
              ].filter(
                child =>
                  child.type === AST_NODE_TYPES.Identifier &&
                  child.name === 'undefined',
              );

              if (undefinedChildren.length > 0) {
                const illegalChild = undefinedChildren[0];
                context.report({
                  node: binaryExpressionNode,
                  data: {
                    nullishKeyword: 'undefined',
                    operator,
                  },
                  messageId: 'unexpectedComparison',
                  ...(undefinedChildren.length === 1 && {
                    fix: (fixer): ReturnType<ReportFixFunction> => {
                      return fixer.replaceText(illegalChild, 'null');
                    },
                  }),
                });
              }
            }

            break;
          default:
            break;
        }
      },
    };
  },
});
