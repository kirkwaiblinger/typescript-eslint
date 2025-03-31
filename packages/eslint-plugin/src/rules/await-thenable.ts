import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import * as tsutils from 'ts-api-utils';
import type * as ts from 'typescript';

import {
  createRule,
  getConstrainedTypeAtLocation,
  getParserServices,
  isAwaitKeyword,
  isTypeAnyType,
  isTypeUnknownType,
  nullThrows,
  NullThrowsReasons,
} from '../util';

const promiseAggregatorMethods = ['all', 'allSettled', 'race', 'any'];

type MessageIds = 'await' | 'removeAwait' | 'nonThenablePromiseAggregator';

type Options = [
  {
    promiseAggregatorMethodStrictness: 'ignore' | 'all' | 'any';
  },
];

export default createRule<Options, MessageIds>({
  name: 'await-thenable',
  meta: {
    docs: {
      description: 'Disallow awaiting a value that is not a Thenable',
      recommended: 'recommended',
      requiresTypeChecking: true,
    },
    hasSuggestions: true,
    messages: {
      await: 'Unexpected `await` of a non-Promise (non-"Thenable") value.',
      removeAwait: 'Remove unnecessary `await`.',
      nonThenablePromiseAggregator: 'non-thenable passed to promise aggregator',
    },
    schema: [
      {
        type: 'object',
        properties: {
          promiseAggregatorMethodStrictness: {
            type: 'string',
            enum: ['ignore', 'all', 'any'],
          },
        },
        additionalProperties: false,
      },
    ],
    type: 'problem',
  },
  defaultOptions: [{ promiseAggregatorMethodStrictness: 'ignore' }],

  create(context, options) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      AwaitExpression(node): void {
        const type = services.getTypeAtLocation(node.argument);
        if (isTypeAnyType(type) || isTypeUnknownType(type)) {
          return;
        }

        const originalNode = services.esTreeNodeToTSNodeMap.get(node);

        if (!tsutils.isThenableType(checker, originalNode.expression, type)) {
          context.report({
            messageId: 'await',
            node,
            suggest: [
              {
                messageId: 'removeAwait',
                fix(fixer): TSESLint.RuleFix {
                  const awaitKeyword = nullThrows(
                    context.sourceCode.getFirstToken(node, isAwaitKeyword),
                    NullThrowsReasons.MissingToken('await', 'await expression'),
                  );

                  return fixer.remove(awaitKeyword);
                },
              },
            ],
          });
        }
      },

      ...(options[0].promiseAggregatorMethodStrictness === 'ignore'
        ? {}
        : {
            CallExpression(node): void {
              const memberExpression = node.callee;
              if (
                memberExpression.type === AST_NODE_TYPES.MemberExpression &&
                memberExpression.object.type === AST_NODE_TYPES.Identifier &&
                memberExpression.object.name === 'Promise' &&
                memberExpression.property.type === AST_NODE_TYPES.Identifier &&
                promiseAggregatorMethods.includes(
                  memberExpression.property.name,
                ) &&
                node.arguments.length >= 1
              ) {
                const argument = node.arguments[0];
                if (argument.type === AST_NODE_TYPES.SpreadElement) {
                  // edge case we're not trying to handle
                  return;
                }

                // If it's syntactically analyzable we can be more clever about targeted
                // reporting.

                // look for non-sparse array expression argument with no spread elements (i.e. [a, b, c])
                // This is probably a very common use case.
                if (
                  argument.type === AST_NODE_TYPES.ArrayExpression &&
                  argument.elements.every(
                    (
                      element,
                    ): element is Exclude<
                      typeof element,
                      null | TSESTree.SpreadElement
                    > =>
                      element != null &&
                      element.type !== AST_NODE_TYPES.SpreadElement,
                  )
                ) {
                  let isAtLeastOneThenable = false;
                  const reports: TSESLint.ReportDescriptor<MessageIds>[] = [];
                  for (const element of argument.elements) {
                    const type = services.getTypeAtLocation(element);
                    if (isTypeAnyType(type) || isTypeUnknownType(type)) {
                      continue;
                    }

                    const elementTsNode =
                      services.esTreeNodeToTSNodeMap.get(element);

                    if (!tsutils.isThenableType(checker, elementTsNode, type)) {
                      reports.push({
                        messageId: 'nonThenablePromiseAggregator',
                        node: element,
                      });
                    } else {
                      isAtLeastOneThenable = true;
                    }
                  }
                  if (
                    options[0].promiseAggregatorMethodStrictness === 'all' ||
                    (options[0].promiseAggregatorMethodStrictness === 'any' &&
                      !isAtLeastOneThenable)
                  ) {
                    for (const report of reports) {
                      context.report(report);
                    }
                  }

                  return;
                }

                // not syntactically analyzable, just check the type of the argument.

                const type = getConstrainedTypeAtLocation(services, argument);
                const iterableElementTypes = getIteratorElementTypes(
                  checker,
                  type,
                );
                if (
                  iterableElementTypes != null &&
                  !iterableElementTypes.some(elementType =>
                    tsutils.isThenableType(
                      checker,
                      services.esTreeNodeToTSNodeMap.get(argument),
                      elementType,
                    ),
                  )
                ) {
                  context.report({
                    messageId: 'nonThenablePromiseAggregator',
                    node: argument,
                  });
                }
              }
            },
          }),
    };
  },
});

/**
 * Gets the possible types when iterated over.
 * In other words, given some type T,
 * asks what the type of `x` in `for (const x of T)` is.
 */
function getIteratorElementTypes(
  checker: ts.TypeChecker,
  type: ts.Type,
): ts.Type[] | undefined {
  const symbolIterator = tsutils.getWellKnownSymbolPropertyOfType(
    type,
    'iterator',
    checker,
  );
  if (symbolIterator == null) {
    return undefined;
  }
  const elementTypes: ts.Type[] = [];
  const callSignatures = tsutils.getCallSignaturesOfType(
    checker.getTypeOfSymbol(symbolIterator),
  );
  for (const callSignature of callSignatures) {
    const returnType = checker.getReturnTypeOfSignature(callSignature);
    const next = checker.getPropertyOfType(returnType, 'next');
    if (next != null) {
      const nextCallSignatures = tsutils.getCallSignaturesOfType(
        checker.getTypeOfSymbol(next),
      );
      for (const nextCallSignature of nextCallSignatures) {
        const nextReturnType =
          checker.getReturnTypeOfSignature(nextCallSignature);
        elementTypes.push(nextReturnType);
      }
    }
  }
  return elementTypes;
}
