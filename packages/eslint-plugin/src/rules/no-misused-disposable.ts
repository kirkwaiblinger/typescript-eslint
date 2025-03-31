import * as tsutils from 'ts-api-utils';

import { createRule, getParserServices } from '../util';

export default createRule({
  name: 'no-misused-disposable',
  meta: {
    type: 'suggestion',
    docs: {
      description: "Disallow using disposables in ways that won't be disposed",
    },
    messages: {
      misusedDisposable: 'Disposable is misused',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();
    return {
      VariableDeclarator(node) {
        if (node.init == null) {
          return;
        }

        if (
          node.parent.kind === 'using' ||
          node.parent.kind === 'await using'
        ) {
          return;
        }

        const tsNode = services.esTreeNodeToTSNodeMap.get(node.init);

        const type = checker.getTypeAtLocation(tsNode);

        const disposeSymbol = (() => {
          const syncDisposeSymbol = tsutils.getWellKnownSymbolPropertyOfType(
            type,
            'dispose',
            checker,
          );

          if (syncDisposeSymbol != null) {
            return syncDisposeSymbol;
          }

          const asyncDisposeSymbol = tsutils.getWellKnownSymbolPropertyOfType(
            type,
            'asyncDispose',
            checker,
          );

          if (asyncDisposeSymbol != null) {
            return asyncDisposeSymbol;
          }

          return null;
        })();

        if (disposeSymbol == null) {
          return;
        }

        context.report({
          node: node.init,
          messageId: 'misusedDisposable',
        });
      },
    };
  },
});
