import type {} from '@typescript-eslint/rule-tester';
import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/no-misused-promises';
import { getFixturesRootDir } from '../RuleTester';

const rootPath = getFixturesRootDir();

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: rootPath,
      project: './tsconfig.json',
    },
  },
});

ruleTester.run('no-misused-disposable', rule, {
  valid: [],
  invalid: [],
});
