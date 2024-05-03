import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/no-index-access-widening-assertion';
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
    `
declare const nums: Array<number>;
declare const index: 1.2;
const maybeNum = nums[index] as number | undefined;
    `,
    `
declare const nums: Array<number>;
declare const index: 1 | 2 | -1;
const maybeNum = nums[index] as number | undefined;
    `,
    `
[1, 2, 3] as number | undefined;
    `,
    `
[1, 2, 3][0] as number;
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
const maybeNum = <number | undefined>nums[index];
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
    {
      code: `
declare const arr1: Array<number>;
declare const arr2: Array<number>;
declare const index: number;
const maybeNum = <number | undefined>(Math.random() > 0.5 ? arr1 : arr2)[index];
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
    {
      code: `
declare const index: number;
const maybeNum = [1, 2, 3][index] as number | undefined;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 3,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              output: `
declare const index: number;
const maybeNum = [1, 2, 3].at(index);
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
const maybeNum = nums[nums.length - index] as number | undefined;
      `,
      errors: [
        {
          messageId: 'preferArrayAt',
          line: 4,
          suggestions: [
            {
              messageId: 'useArrayAtSuggestion',
              // has extra parens :/
              output: `
declare const nums: Array<number>;
declare const index: number;
const maybeNum = nums.at((nums.length - index));
      `,
            },
          ],
        },
      ],
    },
  ],
});
