import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/prefer-array-at';
import { getFixturesRootDir } from '../RuleTester';

const rootDir = getFixturesRootDir();

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: rootDir,
    project: './tsconfig.json',
  },
});

ruleTester.run('prefer-array-at', rule, {
  valid: [
    `
declare const nums: Array<number>;
const maybeNum = nums['length'] as number | undefined;
    `,
  ],
  invalid: [
    {
      code: `
declare const nums: Array<number>;
declare const index: number;
const maybeNum = nums[index] as number | undefined;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 4,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const nums: Array<number>;
declare const index: number;
const maybeNum = nums.at(index);
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
declare const nums: Array<number>;
declare const index: number;
const maybeNum = nums[index] as undefined | number;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 4,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const nums: Array<number>;
declare const index: number;
const maybeNum = nums.at(index);
      `,
            },
          ],
        },
      ],
    },
  ],
});
