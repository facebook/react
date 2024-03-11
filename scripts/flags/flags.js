'use strict';

const babel = require('@babel/register');
const {transformSync} = require('@babel/core');
const Module = require('module');
const path = require('path');
const fs = require('fs');
babel({
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

const yargs = require('yargs');
const argv = yargs
  .parserConfiguration({
    // Important: This option tells yargs to move all other options not
    // specified here into the `_` key. We use this to send all of the
    // Jest options that we don't use through to Jest (like --watch).
    'unknown-options-as-args': true,
  })
  .wrap(yargs.terminalWidth())
  .options({
    csv: {
      alias: 'c',
      describe: 'output cvs.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    diff: {
      alias: 'd',
      describe: 'output diff of two or more flags.',
      requiresArg: false,
      type: 'array',
      choices: [
        'www',
        'www-modern',
        'rn',
        'rn-fb',
        'canary',
        'next',
        'experimental',
        null,
      ],
      default: null,
    },
    sort: {
      alias: 's',
      describe: 'sort diff by one or more flags.',
      requiresArg: false,
      type: 'string',
      default: 'flag',
      choices: [
        'flag',
        'www',
        'www-modern',
        'rn',
        'rn-fb',
        'canary',
        'next',
        'experimental',
      ],
    },
  }).argv;

// Load ReactNativeFeatureFlags with __NEXT_MAJOR__ replace with 'next'.
// We need to do string replace, since the __NEXT_MAJOR__ is assigned to __EXPERIMENTAL__.
function getReactNativeFeatureFlagsMajor() {
  const virtualName = 'ReactNativeFeatureFlagsMajor.js';
  const file = fs.readFileSync(
    path.join(__dirname, '../../packages/shared/ReactFeatureFlags.js'),
    'utf8'
  );
  const fileContent = transformSync(
    file.replace(
      'const __NEXT_MAJOR__ = __EXPERIMENTAL__;',
      'const __NEXT_MAJOR__ = "next";'
    ),
    {
      plugins: ['@babel/plugin-transform-modules-commonjs'],
    }
  ).code;

  const parent = module.parent;
  const m = new Module(virtualName, parent);
  m.filename = virtualName;

  m._compile(fileContent, virtualName);

  return m.exports;
}

// The RN and www Feature flag files import files that don't exist.
// Mock the imports with the dynamic flag values.
function mockDynamicallyFeatureFlags() {
  // Mock the ReactNativeInternalFeatureFlags and ReactFeatureFlags modules
  const DynamicFeatureFlagsWWW = require('../../packages/shared/forks/ReactFeatureFlags.www-dynamic.js');
  const DynamicFeatureFlagsNative = require('../../packages/shared/forks/ReactFeatureFlags.native-fb-dynamic.js');

  const originalLoad = Module._load;

  Module._load = function (request, parent) {
    if (request === 'ReactNativeInternalFeatureFlags') {
      return DynamicFeatureFlagsNative;
    } else if (request === 'ReactFeatureFlags') {
      return DynamicFeatureFlagsWWW;
    }

    return originalLoad.apply(this, arguments);
  };
}
// Set the globals to string values to output them to the table.
global.__VARIANT__ = 'gk';
global.__PROFILE__ = 'profile';
global.__DEV__ = 'dev';
global.__EXPERIMENTAL__ = 'experimental';

// Load all the feature flag files.
mockDynamicallyFeatureFlags();
const ReactFeatureFlags = require('../../packages/shared/ReactFeatureFlags.js');
const ReactFeatureFlagsWWW = require('../../packages/shared/forks/ReactFeatureFlags.www.js');
const ReactFeatureFlagsNativeFB = require('../../packages/shared/forks/ReactFeatureFlags.native-fb.js');
const ReactFeatureFlagsNativeOSS = require('../../packages/shared/forks/ReactFeatureFlags.native-oss.js');
const ReactFeatureFlagsMajor = getReactNativeFeatureFlagsMajor();

const allFlagsUniqueFlags = Array.from(
  new Set([
    ...Object.keys(ReactFeatureFlags),
    ...Object.keys(ReactFeatureFlagsWWW),
    ...Object.keys(ReactFeatureFlagsNativeFB),
    ...Object.keys(ReactFeatureFlagsNativeOSS),
  ])
).sort();

// These functions are the rules for what each value means in each channel.
function getNextMajorFlagValue(flag) {
  const value = ReactFeatureFlagsMajor[flag];
  if (value === true || value === 'next') {
    return '✅';
  } else if (value === false || value === 'experimental') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Unexpected OSS Stable value ${value} for flag ${flag}`);
  }
}

function getOSSCanaryFlagValue(flag) {
  const value = ReactFeatureFlags[flag];
  if (value === true) {
    return '✅';
  } else if (value === false || value === 'experimental' || value === 'next') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Unexpected OSS Canary value ${value} for flag ${flag}`);
  }
}

function getOSSExperimentalFlagValue(flag) {
  const value = ReactFeatureFlags[flag];
  if (value === true || value === 'experimental') {
    return '✅';
  } else if (value === false || value === 'next') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(
      `Unexpected OSS Experimental value ${value} for flag ${flag}`
    );
  }
}

function getWWWModernFlagValue(flag) {
  const value = ReactFeatureFlagsWWW[flag];
  if (value === true || value === 'experimental') {
    return '✅';
  } else if (value === false || value === 'next') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (value === 'gk') {
    return '🧪';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Unexpected WWW Modern value ${value} for flag ${flag}`);
  }
}

function getWWWClassicFlagValue(flag) {
  const value = ReactFeatureFlagsWWW[flag];
  if (value === true) {
    return '✅';
  } else if (value === false || value === 'experimental' || value === 'next') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (value === 'gk') {
    return '🧪';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Unexpected WWW Classic value ${value} for flag ${flag}`);
  }
}

function getRNOSSFlagValue(flag) {
  const value = ReactFeatureFlagsNativeOSS[flag];
  if (value === true) {
    return '✅';
  } else if (value === false || value === 'experimental' || value === 'next') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (value === 'gk') {
    return '🧪';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Unexpected RN OSS value ${value} for flag ${flag}`);
  }
}

function getRNFBFlagValue(flag) {
  const value = ReactFeatureFlagsNativeFB[flag];
  if (value === true) {
    return '✅';
  } else if (value === false || value === 'experimental' || value === 'next') {
    return '❌';
  } else if (value === 'profile') {
    return '📊';
  } else if (value === 'dev') {
    return '💻';
  } else if (value === 'gk') {
    return '🧪';
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(`Unexpected RN FB value ${value} for flag ${flag}`);
  }
}

function argToHeader(arg) {
  switch (arg) {
    case 'www':
      return 'WWW Classic';
    case 'www-modern':
      return 'WWW Modern';
    case 'rn':
      return 'RN OSS';
    case 'rn-fb':
      return 'RN FB';
    case 'canary':
      return 'OSS Canary';
    case 'next':
      return 'OSS Next Major';
    case 'experimental':
      return 'OSS Experimental';
    default:
      return arg;
  }
}

// Build the table with the value for each flag.
const isDiff = argv.diff != null && argv.diff.length > 1;
const table = {};
// eslint-disable-next-line no-for-of-loops/no-for-of-loops
for (const flag of allFlagsUniqueFlags) {
  const values = {
    'OSS Next Major': getNextMajorFlagValue(flag),
    'OSS Canary': getOSSCanaryFlagValue(flag),
    'OSS Experimental': getOSSExperimentalFlagValue(flag),
    'WWW Classic': getWWWClassicFlagValue(flag),
    'WWW Modern': getWWWModernFlagValue(flag),
    'RN FB': getRNFBFlagValue(flag),
    'RN OSS': getRNOSSFlagValue(flag),
  };

  if (!isDiff) {
    table[flag] = values;
    continue;
  }

  const subset = argv.diff.map(argToHeader).reduce((acc, key) => {
    if (key in values) {
      acc[key] = values[key];
    }
    return acc;
  }, {});

  if (new Set(Object.values(subset)).size !== 1) {
    table[flag] = subset;
  }
}

// Sort the table
let sorted = table;
if (isDiff || argv.sort) {
  const sortChannel = argToHeader(isDiff ? argv.diff[0] : argv.sort);
  const sortBy =
    sortChannel === 'flag'
      ? ([flagA], [flagB]) => {
          return flagA.localeCompare(flagB);
        }
      : ([, rowA], [, rowB]) => {
          return rowB[sortChannel].toString().localeCompare(rowA[sortChannel]);
        };
  sorted = Object.fromEntries(Object.entries(table).sort(sortBy));
}

if (argv.csv) {
  const csvHeader =
    'Flag name, WWW Classic, RN FB, OSS Canary, OSS Experimental, WWW Modern, RN OSS\n';
  const csvRows = Object.keys(sorted).map(flag => {
    const row = sorted[flag];
    return `${flag}, ${row['WWW Classic']}, ${row['RN FB']}, ${row['OSS Canary']}, ${row['OSS Experimental']}, ${row['WWW Modern']}, ${row['RN OSS']}`;
  });
  fs.writeFile('./flags.csv', csvHeader + csvRows.join('\n'), function (err) {
    if (err) {
      return console.log(err);
    }
    console.log('The file was saved!');
  });
}

// left align the flag names.
const maxLength = Math.max(...Object.keys(sorted).map(item => item.length));
const padded = {};
Object.keys(sorted).forEach(key => {
  const newKey = key.padEnd(maxLength, ' ');
  padded[newKey] = sorted[key];
});

// print table with formatting
console.table(padded);
