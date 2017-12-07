const judgeJSFilesVersion = require('../judgeJSFilesVersion');

describe('judgeJSFilesVersion', () => {
  it('should match different es versions', () => {
    const es6Files = [
      'packages/react/index.js',
      'packages/react/src/forks/some.js',
      'packages/shared/ReactTypes.js',
    ];

    const es5Files = [
      'packages/react/npm/aa/a.js',
      'scripts/aa/a.js',
      'fixtures/aa/a.js',
    ];

    const jsFiles = es6Files.concat(es5Files);

    expect(judgeJSFilesVersion(jsFiles)).toEqual({es6Files, es5Files});
  });
});
