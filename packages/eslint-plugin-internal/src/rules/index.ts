import type { Linter } from '@typescript-eslint/utils/ts-eslint';

import betterEqeqeq from './better-eqeqeq';
import noPoorlyTypedTsProps from './no-poorly-typed-ts-props';
import noRelativePathsToInternalPackages from './no-relative-paths-to-internal-packages';
import noTypescriptDefaultImport from './no-typescript-default-import';
import noTypescriptEstreeImport from './no-typescript-estree-import';
import pluginTestFormatting from './plugin-test-formatting';
import preferASTTypesEnum from './prefer-ast-types-enum';

export default {
  'no-poorly-typed-ts-props': noPoorlyTypedTsProps,
  'no-relative-paths-to-internal-packages': noRelativePathsToInternalPackages,
  'no-typescript-default-import': noTypescriptDefaultImport,
  'no-typescript-estree-import': noTypescriptEstreeImport,
  'plugin-test-formatting': pluginTestFormatting,
  'prefer-ast-types-enum': preferASTTypesEnum,
  'better-eqeqeq': betterEqeqeq,
} satisfies Linter.PluginRules;
