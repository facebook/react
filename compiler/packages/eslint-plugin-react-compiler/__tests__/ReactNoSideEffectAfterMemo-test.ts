import { RuleTester } from 'eslint';
import { noSideEffectAfterMemo } from '../src/rules/noSideEffectAfterMemo';

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

tester.run('no-side-effect-after-memo', noSideEffectAfterMemo, {
  valid: [
    `const value = useMemo(() => compute(), []);
     console.log(value);`,
  ],
  invalid: [
    {
      code: `
        const result = useMemo(() => fetchData(), []);
        result.modified = true;
      `,
      errors: [{ messageId: 'sideEffectAfterMemo' }],
    },
  ],
});
