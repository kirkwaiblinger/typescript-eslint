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
    `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray.array?.[index] as undefined | number;
    `,
    `
declare const index: 12 | 13 | 'length';
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array[index] as undefined | number;
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
    {
      code: `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray.array[index] as undefined | number;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 6,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray.array.at(index);
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array[index] as undefined | number;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 6,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array.at(index);
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array[12] as undefined | number;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 6,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const index: number;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array.at(12);
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
declare const index: 12 | 13;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array[index] as undefined | number;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 6,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const index: 12 | 13;
const objectWithArray = {
  array: [1, 2, 3],
};
const maybeNum = objectWithArray?.array.at(index);
      `,
            },
          ],
        },
      ],
    },
    {
      code: `
declare const arr1: Array<number>;
declare const arr2: Array<number>;
declare const index: number;
const maybeNum = (Math.random() > 0.5 ? arr1 : arr2)[index] as
  | number
  | undefined;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const arr1: Array<number>;
declare const arr2: Array<number>;
declare const index: number;
const maybeNum = (Math.random() > 0.5 ? arr1 : arr2).at(index);
      `,
            },
          ],
        },
      ],
    },
  ],
});
