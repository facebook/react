'use strict';

const CLIEngine = require('eslint').CLIEngine;
// console.log(require.resolve('eslint-plugin-react-hooks'))

describe('react-hooks', () => {
  test('recommended config', () => {
    const cli = new CLIEngine({
      useEslintrc: false,
      baseConfig: {
        extends: [`plugin:react-hooks/recommended`],
      }
    });
    const config = cli.getConfigForFile(__filename);
    expect(config).toEqual(expect.objectContaining({
      plugins: ['react-hooks'],
      rules: {
        'react-hooks/rules-of-hooks': ['error'],
        'react-hooks/exhaustive-deps': ['warn'],
      },
    }));
  });
});
