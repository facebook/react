'use strict';

const path = require('path');

const {ESLint} = require('eslint');

function getESLintInstance(format) {
  return new ESLint({
    useEslintrc: false,
    overrideConfigFile: path.join(__dirname, `eslintrc.${format}.js`),
    ignore: false,
  });
}

const esLints = {
  cjs: getESLintInstance('cjs'),
};

// Performs sanity checks on bundles *built* by Rollup.
// Helps catch Rollup regressions.
async function lint() {
  const eslint = esLints.cjs;

  const results = await eslint.lintFiles([
    __dirname + '/../../../tmp/cjs/react-jsx-dev-runtime.development.js',
    __dirname + '/../../../tmp/cjs/react-jsx-dev-runtime.production.min.js',
    __dirname + '/../../../tmp/cjs/react-jsx-runtime.development.js',
    __dirname + '/../../../tmp/cjs/react-jsx-runtime.production.min.js',
  ]);
  if (
    results.some(result => result.errorCount > 0 || result.warningCount > 0)
  ) {
    process.exitCode = 1;
    console.log(`Failed`);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText);
  }
}

async function lintEverything() {
  console.log(`Linting known bundles...`);
  await lint();
}

lintEverything().catch(error => {
  process.exitCode = 1;
  console.error(error);
});
