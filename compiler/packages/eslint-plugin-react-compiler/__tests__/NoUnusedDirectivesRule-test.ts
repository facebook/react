/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NoUnusedDirectivesRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule} from './shared-utils';

testRule('no unused directives rule', NoUnusedDirectivesRule, {
  valid: [],
  invalid: [
    {
      name: "Unused 'use no forget' directive is reported when no errors are present on components",
      code: normalizeIndent`
        function Component() {
          'use no forget';
          return <div>Hello world</div>
        }
      `,
      errors: [
        {
          message: "Unused 'use no forget' directive",
          suggestions: [
            {
              output:
                // yuck
                '\nfunction Component() {\n  \n  return <div>Hello world</div>\n}\n',
            },
          ],
        },
      ],
    },

    {
      name: "Unused 'use no forget' directive is reported when no errors are present on non-components or hooks",
      code: normalizeIndent`
        function notacomponent() {
          'use no forget';
          return 1 + 1;
        }
      `,
      errors: [
        {
          message: "Unused 'use no forget' directive",
          suggestions: [
            {
              output:
                // yuck
                '\nfunction notacomponent() {\n  \n  return 1 + 1;\n}\n',
            },
          ],
        },
      ],
    },
  ],
});
