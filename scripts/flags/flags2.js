'use strict';

/**
 * Advanced Feature Flag Tool
 * This script builds upon the base flag logic with enhanced modularity,
 * plugin-style extensions, and improved CLI ergonomics.
 */

const path = require('path');
const fs = require('fs');
const yargs = require('yargs');
const { transformSync } = require('@babel/core');
const babelRegister = require('@babel/register');
const Module = require('module');

// Babel register for transpilation support
babelRegister({
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

// CLI Setup
const argv = yargs
  .parserConfiguration({ 'unknown-options-as-args': true })
  .usage('Usage: $0 [options]')
  .options({
    csv: {
      alias: 'c',
      describe: 'Output results to CSV.',
      type: 'boolean',
      default: false,
    },
    view: {
      alias: 'v',
      describe: 'View mode (table|json)',
      choices: ['table', 'json'],
      default: 'table',
    },
    filter: {
      alias: 'f',
      describe: 'Only show flags matching this substring.',
      type: 'string',
    },
    modules: {
      alias: 'm',
      describe: 'List of flag modules to load.',
      type: 'array',
      default: ['oss', 'rn', 'www'],
    },
  })
  .help()
  .argv;

// Globals for consistency
global.__DEV__ = 'dev';
global.__EXPERIMENTAL__ = 'experimental';
global.__PROFILE__ = 'profile';
global.__VARIANT__ = 'gk';

/**
 * Dynamically load and patch a flag file
 */
function loadFlags(filePath, replacements = {}) {
  const name = path.basename(filePath);
  let source = fs.readFileSync(filePath, 'utf8');

  for (const [search, replace] of Object.entries(replacements)) {
    source = source.replace(search, replace);
  }

  const code = transformSync(source, {
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;

  const mod = new Module(name);
  mod._compile(code, name);

  return mod.exports;
}

// Flag modules
const MODULE_PATHS = {
  oss: '../../packages/shared/ReactFeatureFlags.js',
  www: '../../packages/shared/forks/ReactFeatureFlags.www.js',
  rn: '../../packages/shared/forks/ReactFeatureFlags.native-fb.js',
};

// Load selected flag modules
const loadedFlags = {};
argv.modules.forEach(mod => {
  if (MODULE_PATHS[mod]) {
    loadedFlags[mod] = require(MODULE_PATHS[mod]);
  }
});

// Unique flags
const allFlags = Array.from(
  new Set(
    Object.values(loadedFlags).flatMap(obj => Object.keys(obj))
  )
).sort();

// Formatting helpers
function symbolize(val) {
  switch (val) {
    case true:
    case 'next':
      return '✅';
    case false:
    case null:
      return '❌';
    case 'dev':
      return '💻';
    case 'profile':
      return '📊';
    case 'gk':
      return '🧪';
    default:
      return typeof val === 'number' ? val : '?';
  }
}

// Build the result table
function buildFlagTable() {
  const table = {};
  for (const flag of allFlags) {
    if (argv.filter && !flag.includes(argv.filter)) continue;
    table[flag] = {};
    for (const [mod, flags] of Object.entries(loadedFlags)) {
      table[flag][mod] = symbolize(flags[flag]);
    }
  }
  return table;
}

const table = buildFlagTable();

if (argv.view === 'json') {
  console.log(JSON.stringify(table, null, 2));
} else {
  const longest = Math.max(...Object.keys(table).map(k => k.length));
  for (const flag in table) {
    const row = table[flag];
    const display = Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    console.log(flag.padEnd(longest), '->', display);
  }
}

if (argv.csv) {
  const header = ['flag', ...Object.keys(loadedFlags)].join(',');
  const rows = Object.entries(table).map(
    ([flag, mods]) => [flag, ...Object.values(mods)].join(',')
  );
  fs.writeFileSync('flags-out.csv', [header, ...rows].join('\n'));
  console.log('CSV saved to flags-out.csv');
}

console.log(`\nLegend:\n✅ On\n❌ Off\n💻 DEV\n📊 Profiling\n🧪 Experiment`);
