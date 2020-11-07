/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-production-logging');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester();

ruleTester.run('no-production-logging', rule, {
  valid: [
    {
      code: `
        if (__DEV__) {
          console.error('Oh no');
        }
      `,
    },
    {
      code: `
        if (__DEV__) {
          console.error('Hello %s', foo)
        }
      `,
    },
    {
      code: `
        if (__DEV__) {
          console.error('Hello %s %s', foo, bar)
        }
      `,
    },
    {
      code: `
        if (__DEV__) {
          console.warn('Oh no');
        }
      `,
    },
    {
      code: `
        if (__DEV__) {
          console.warn('Oh no');
        }
      `,
    },
    // This is OK too because it's wrapped outside:
    {
      code: `
        if (__DEV__) {
          if (potato) {
            while (true) {
              console.error('Oh no');
            }
          }
        }`,
    },
    {
      code: `
        var f;
        if (__DEV__) {
          f = function() {
            if (potato) {
              while (true) {
                console.error('Oh no');
              }
            }
          };
        }`,
    },
    // Don't do anything with these:
    {
      code: 'normalFunctionCall(test);',
    },
    {
      code: 'invariant(test);',
    },
    {
      code: `
        if (__DEV__) {
          normalFunctionCall(test);
        }
      `,
    },
    // This is OK because of the outer if.
    {
      code: `
        if (__DEV__) {
          if (foo) {
            if (__DEV__) {
            } else {
              console.error('Oh no');
            }
          }
        }`,
    },
    {
      // This is an escape hatch that makes it fire in production.
      code: `
        console['error']('Oh no');
      `,
    },
  ],
  invalid: [
    {
      code: "console.error('Oh no');",
      output: "if (__DEV__) {console.error('Oh no')};",
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: "console.warn('Oh no');",
      output: "if (__DEV__) {console.warn('Oh no')};",
      errors: [
        {
          message: `Wrap console.warn() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: "console.warn('Oh no')",
      output: "if (__DEV__) {console.warn('Oh no')}",
      errors: [
        {
          message: `Wrap console.warn() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (potato) {
          console.warn('Oh no');
        }
      `,
      output: `
        if (potato) {
          if (__DEV__) {console.warn('Oh no')};
        }
      `,
      errors: [
        {
          message: `Wrap console.warn() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (__DEV__ || potato && true) {
          console.error('Oh no');
        }
      `,
      output: `
        if (__DEV__ || potato && true) {
          if (__DEV__) {console.error('Oh no')};
        }
      `,
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (banana && __DEV__ && potato && kitten) {
          console.error('Oh no');
        }
      `,
      output: `
        if (banana && __DEV__ && potato && kitten) {
          if (__DEV__) {console.error('Oh no')};
        }
      `,
      // Technically this code is valid but we prefer
      // explicit standalone __DEV__ blocks that stand out.
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (!__DEV__) {
          console.error('Oh no');
        }
      `,
      output: `
        if (!__DEV__) {
          if (__DEV__) {console.error('Oh no')};
        }
      `,
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (foo || x && __DEV__) {
          console.error('Oh no');
        }
      `,
      output: `
        if (foo || x && __DEV__) {
          if (__DEV__) {console.error('Oh no')};
        }
      `,
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (__DEV__) {
        } else {
          console.error('Oh no');
        }
      `,
      output: `
        if (__DEV__) {
        } else {
          if (__DEV__) {console.error('Oh no')};
        }
      `,
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (__DEV__) {
        } else {
          if (__DEV__) {
          } else {
            console.error('Oh no');
          }
        }
      `,
      output: `
        if (__DEV__) {
        } else {
          if (__DEV__) {
          } else {
            if (__DEV__) {console.error('Oh no')};
          }
        }
      `,
      errors: [
        {
          message: `Wrap console.error() in an "if (__DEV__) {}" check`,
        },
      ],
    },
    {
      code: `
        if (__DEV__) {
          console.log('Oh no');
        }
      `,
      errors: [
        {
          message: 'Unexpected use of console',
        },
      ],
    },
    {
      code: `
        if (__DEV__) {
          console.log.apply(console, 'Oh no');
        }
      `,
      errors: [
        {
          message: 'Unexpected use of console',
        },
      ],
    },
  ],
});
