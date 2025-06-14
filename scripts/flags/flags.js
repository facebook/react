'use strict';

const babel = require('@babel/register');
const { transformSync } = require('@babel/core');
const Module = require('module');
const path = require('path');
const fs = require('fs');
const yargs = require('yargs');

// Set up Babel to use the correct plugin for transforming modules
babel({
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

const argv = yargs
  .parserConfiguration({
    'unknown-options-as-args': true, // Pass unknown options to args
  })
  .wrap(yargs.terminalWidth())
  .options({
    csv: {
      alias: 'c',
      describe: 'Output CSV.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
    diff: {
      alias: 'd',
      describe: 'Output diff of two or more flags.',
      requiresArg: false,
      type: 'array',
      choices: [
        'www',
        'www-modern',
        'rn',
        'rn-fb',
        'rn-next',
        'canary',
        'next',
        'experimental',
        null,
      ],
      default: null,
    },
    sort: {
      alias: 's',
      describe: 'Sort diff by one or more flags.',
      requiresArg: false,
      type: 'string',
      default: 'flag',
      choices: [
        'flag',
        'www',
        'www-modern',
        'rn',
        'rn-fb',
        'rn-next',
        'canary',
        'next',
        'experimental',
      ],
    },
    cleanup: {
      describe: 'Output flags by cleanup category.',
      requiresArg: false,
      type: 'boolean',
      default: false,
    },
  }).argv;

// Load ReactFeatureFlags with __NEXT_MAJOR__ replaced with 'next'
function getReactFeatureFlagsMajor() {
  const virtualName = 'ReactFeatureFlagsMajor.js';
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

// Load RN ReactFeatureFlags with __NEXT_RN_MAJOR__ replaced with 'next'
function getReactNativeFeatureFlagsMajor() {
  const virtualName = 'ReactNativeFeatureFlagsMajor.js';
  const file = fs.readFileSync(
    path.join(__dirname, '../../packages/shared/forks/ReactFeatureFlags.native-oss.js'),
    'utf8'
  );
  const fileContent = transformSync(
    file
      .replace(
        'const __NEXT_RN_MAJOR__ = true;',
        'const __NEXT_RN_MAJOR__ = "next";'
      )
      .replace(
        'const __TODO_NEXT_RN_MAJOR__ = false;',
        'const __TODO_NEXT_RN_MAJOR__ = "next-todo";'
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

// Set global constants
global.__VARIANT__ = 'gk';
global.__PROFILE__ = 'profile';
global.__DEV__ = 'dev';
global.__EXPERIMENTAL__ = 'experimental';

// Load all the feature flag files.
mockDynamicallyFeatureFlags();
const ReactFeatureFlags = require('../../packages/shared/ReactFeatureFlags.js');
const ReactFeatureFlagsWWW = require('../../packages/shared/forks/ReactFeatureFlags.www.js');
const ReactFeatureFlagsNativeFB = require('../../packages/shared/forks/ReactFeatureFlags.native-fb.js');
const ReactFeatureFlagsMajor = getReactFeatureFlagsMajor();
const ReactNativeFeatureFlagsMajor = getReactNativeFeatureFlagsMajor();

// Combine all flags into a unique list
const allFlagsUniqueFlags = Array.from(
  new Set([
    ...Object.keys(ReactFeatureFlags),
    ...Object.keys(ReactFeatureFlagsWWW),
    ...Object.keys(ReactFeatureFlagsNativeFB),
  ])
).sort();

// Simplify flag value mapping using a helper function
function getFlagValue(flag, flagData) {
  const value = flagData[flag];
  switch (value) {
    case true:
    case 'next':
      return '✅';
    case false:
    case null:
    case 'experimental':
      return '❌';
    case 'profile':
      return '📊';
    case 'dev':
      return '💻';
    case 'gk':
      return '🧪';
    default:
      return typeof value === 'number' ? value : '❓';
  }
}

// Create a general-purpose function to format flag values
const FLAG_CONFIG = {
  'OSS Next Major': (flag) => getFlagValue(flag, ReactFeatureFlagsMajor),
  'OSS Canary': (flag) => getFlagValue(flag, ReactFeatureFlags),
  'OSS Experimental': (flag) => getFlagValue(flag, ReactFeatureFlags),
  'WWW Classic': (flag) => getFlagValue(flag, ReactFeatureFlagsWWW),
  'WWW Modern': (flag) => getFlagValue(flag, ReactFeatureFlagsWWW),
  'RN FB': (flag) => getFlagValue(flag, ReactFeatureFlagsNativeFB),
  'RN OSS': (flag) => getFlagValue(flag, ReactNativeFeatureFlagsMajor),
  'RN Next Major': (flag) => getFlagValue(flag, ReactNativeFeatureFlagsMajor),
};

const FLAG_COLUMNS = Object.keys(FLAG_CONFIG);

// Function to build the table with filtered flags
function buildTable(filterFn) {
  const isDiff = argv.diff != null && argv.diff.length > 1;
  const table = {};

  // Apply the filter function if provided
  const filteredFlags = filterFn
    ? allFlagsUniqueFlags.filter(filterFn)
    : allFlagsUniqueFlags;

  // Iterate over each flag and calculate its values for the columns
  for (const flag of filteredFlags) {
    const values = FLAG_COLUMNS.reduce((acc, key) => {
      acc[key] = FLAG_CONFIG[key](flag);
      return acc;
    }, {});

    if (!isDiff) {
      table[flag] = values;
      continue;
    }

    const subset = argv.diff
      .map(argToHeader)
      .reduce((acc, key) => {
        if (key in values) {
          acc[key] = values[key];
        }
        return acc;
      }, {});

    if (new Set(Object.values(subset)).size !== 1) {
      table[flag] = subset;
    }
  }

  // Sort the table if necessary
  let sorted = table;
  if (isDiff || argv.sort) {
    const sortChannel = argToHeader(isDiff ? argv.diff[0] : argv.sort);
    const sortBy =
      sortChannel === 'flag'
        ? ([flagA], [flagB]) => flagA.localeCompare(flagB)
        : ([, rowA], [, rowB]) =>
            rowB[sortChannel].toString().localeCompare(rowA[sortChannel]);
    sorted = Object.fromEntries(Object.entries(table).sort(sortBy));
  }

  return sorted;
}

// Function to format the table as CSV
function formatTableAsCSV(table) {
  const header = Object.keys(FLAG_CONFIG).join(',');
  const rows = Object.entries(table)
    .map(([flag, row]) => {
      return [flag, ...Object.values(row)].join(',');
    })
    .join('\n');
  return `${header}\n${rows}`;
}

// Main function to output data
function output() {
  const table = buildTable();
  const csv = formatTableAsCSV(table);

  if (argv.csv) {
    fs.writeFileSync('output.csv', csv, 'utf8');
    console.log('CSV output written to output.csv');
  } else {
    console.log(csv);
  }
}

output();
