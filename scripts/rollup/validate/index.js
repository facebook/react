'use strict';

const path = require('path');

const {ESLint} = require('eslint');

const {bundles, getFilename, bundleTypes} = require('../bundles');
const Packaging = require('../packaging');

const {
  NODE_ES2015,
  NODE_ESM,
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
  FB_WWW_DEV,
  FB_WWW_PROD,
  FB_WWW_PROFILING,
  RN_OSS_DEV,
  RN_OSS_PROD,
  RN_OSS_PROFILING,
  RN_FB_DEV,
  RN_FB_PROD,
  RN_FB_PROFILING,
} = bundleTypes;

function getFormat(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
      return 'umd';
    case NODE_ES2015:
      return 'cjs2015';
    case NODE_ESM:
      return 'esm';
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
      return 'cjs';
    case FB_WWW_DEV:
    case FB_WWW_PROD:
    case FB_WWW_PROFILING:
      return 'fb';
    case RN_OSS_DEV:
    case RN_OSS_PROD:
    case RN_OSS_PROFILING:
    case RN_FB_DEV:
    case RN_FB_PROD:
    case RN_FB_PROFILING:
      return 'rn';
  }
  throw new Error('unknown bundleType');
}

function getESLintInstance(format) {
  return new ESLint({
    useEslintrc: false,
    overrideConfigFile: path.join(__dirname, `eslintrc.${format}.js`),
    ignore: false,
  });
}

const esLints = {
  cjs: getESLintInstance('cjs'),
  cjs2015: getESLintInstance('cjs2015'),
  esm: getESLintInstance('esm'),
  rn: getESLintInstance('rn'),
  fb: getESLintInstance('fb'),
  umd: getESLintInstance('umd'),
};

// Performs sanity checks on bundles *built* by Rollup.
// Helps catch Rollup regressions.
async function lint(bundle, bundleType) {
  const filename = getFilename(bundle, bundleType);
  const format = getFormat(bundleType);
  const eslint = esLints[format];

  const packageName = Packaging.getPackageName(bundle.entry);
  const mainOutputPath = Packaging.getBundleOutputPath(
    bundleType,
    filename,
    packageName
  );

  const results = await eslint.lintFiles([mainOutputPath]);
  if (
    results.some(result => result.errorCount > 0 || result.warningCount > 0)
  ) {
    process.exitCode = 1;
    console.log(`Failed ${mainOutputPath}`);
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    console.log(resultText);
  }
}

async function lintEverything() {
  console.log(`Linting known bundles...`);
  let promises = [];
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of bundles) {
    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const bundleType of bundle.bundleTypes) {
      promises.push(lint(bundle, bundleType));
    }
  }
  await Promise.all(promises);
}

lintEverything().catch(error => {
  process.exitCode = 1;
  console.error(error);
});
