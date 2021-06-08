'use strict';

const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const closure = require('../scripts/rollup/plugins/closure-plugin');
const sizes = require('../scripts/rollup/plugins/sizes-plugin');
const useForks = require('../scripts/rollup/plugins/use-forks-plugin');
const stripUnusedImports = require('../scripts/rollup/plugins/strip-unused-imports');
const extractErrorCodes = require('../scripts/error-codes/extract-errors');
const Constants = require('./const');
const Modules = require('../scripts/rollup/modules');
const Stats = require('../scripts/rollup/stats');
const commonjs = require('rollup-plugin-commonjs');
const prettier = require('rollup-plugin-prettier');
const replace = require('rollup-plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const chalk = require('chalk');
const resolve = require('rollup-plugin-node-resolve');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const codeFrame = require('babel-code-frame');
const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

const reactVersion = '17.0.1';
// Errors in promises should be fatal.
let loggedErrors = new Set();
process.on('unhandledRejection', err => {
  if (loggedErrors.has(err)) {
    // No need to print it twice.
    process.exit(1);
  }
  throw err;
});

const {AMD_DEV, AMD_PROD, AMD_PROFILING} = Constants.bundleTypes;

const forcePrettyOutput = argv.pretty;
const isWatchMode = argv.watch;
const shouldExtractErrors = argv['extract-errors'];
const errorCodeOpts = {
  errorMapFilePath: 'scripts/error-codes/codes.json',
};

const closureOptions = {
  compilation_level: 'SIMPLE',
  language_in: 'ECMASCRIPT5_STRICT',
  language_out: 'ECMASCRIPT5_STRICT',
  env: 'CUSTOM',
  warning_level: 'QUIET',
  apply_input_source_maps: false,
  use_types_for_optimization: false,
  process_common_js_modules: false,
  rewrite_polyfills: false,
};

function getBabelConfig(updateBabelOptions, bundleType, filename) {
  let options = {
    exclude: '/**/node_modules/**',
    presets: [],
    plugins: [],
  };
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }
  switch (bundleType) {
    case AMD_DEV:
    case AMD_PROD:
    case AMD_PROFILING:
      return Object.assign({}, options, {
        plugins: options.plugins.concat([
          // Minify invariant messages
          require('../scripts/error-codes/transform-error-messages'),
        ]),
      });
    default:
      return options;
  }
}

function getRollupOutputOptions(
  outputPath,
  globals,
  globalName,
  bundleType,
  packageName
) {
  const isProduction = isProductionBundleType(bundleType);

  return Object.assign(
    {},
    {
      file: outputPath,
      globals,
      // Добавили опции выходного файла для AMD формата
      format: `amd`,
      amd: {
        id: packageName
      },
      freeze: !isProduction,
      interop: false,
      name: globalName,
      sourcemap: false
    }
  );
}

function getFilename(name, globalName, bundleType) {
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/', '-');
  switch (bundleType) {
    case AMD_DEV:
      return `${name}.development.js`;
    case AMD_PROD:
      return `${name}.production.min.js`;
    case AMD_PROFILING:
      return `${name}.profiling.min.js`;
  }
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case AMD_DEV:
      return false;
    case AMD_PROD:
    case AMD_PROFILING:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function getPlugins(
  entry,
  externals,
  updateBabelOptions,
  filename,
  packageName,
  bundleType,
  globalName,
  moduleType,
  pureExternalModules,
  bundle
) {
  const findAndRecordErrorCodes = extractErrorCodes(errorCodeOpts);
  const forks = Modules.getForks(bundleType, entry, moduleType, bundle);
  const isProduction = isProductionBundleType(bundleType);
  const isProfiling = bundleType === AMD_PROFILING;
  const shouldStayReadable = forcePrettyOutput;
  return [
    // Extract error codes from invariant() messages into a file.
    shouldExtractErrors && {
      transform(source) {
        findAndRecordErrorCodes(source);
        return source;
      },
    },
    // Shim any modules that need forking in this environment.
    useForks(forks),
    // Use Node resolution mechanism.
    resolve({
      skip: externals,
    }),
    // Remove license headers from individual modules
    stripBanner({
      exclude: 'node_modules/**/*',
    }),
    // Compile to ES5.
    babel(getBabelConfig(updateBabelOptions, bundleType)),
    // Remove 'use strict' from individual source files.
    {
      transform(source) {
        return source.replace(/['"]use strict["']/g, '');
      },
    },
    // Turn __DEV__ and process.env checks into constants.
    replace({
      __DEV__: isProduction ? 'false' : 'true',
      __PROFILE__: isProfiling || !isProduction ? 'true' : 'false',
      __UMD__: 'true',
      'process.env.NODE_ENV': isProduction ? "'production'" : "'development'",
      __EXPERIMENTAL__,
    }),
    // We still need CommonJS for external deps like object-assign.
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'object-assign': ['default']
      }
    }),
    // Apply dead code elimination and/or minification.
    isProduction &&
    closure(
      Object.assign({}, closureOptions, {
        // Don't let it create global variables in the browser.
        // https://github.com/facebook/react/issues/10909
        assume_function_wrapper: true,
        renaming: !shouldStayReadable,
      })
    ),
    // HACK to work around the fact that Rollup isn't removing unused, pure-module imports.
    // Note that this plugin must be called after closure applies DCE.
    isProduction && stripUnusedImports(pureExternalModules),
    // Add the whitespace back if necessary.
    shouldStayReadable && prettier({parser: 'babylon'}),
    // License and haste headers, top-level `if` blocks.
    // Так как из amd модулей нет доступа к ключевому слову module,
    // а react грузит внутри модуль timers через него, мы объявляем его глобально
    // в модуле и указываем requirejs как функцию загрузки
    {
      renderChunk(source) {
        return `/** @license React v${reactVersion}
* ${filename}
*
${Constants.license}
*/
var module = {require: requirejs};
${source}`;
      },
    },
    // Record bundle size.
    sizes({
      getSize: (size, gzip) => {
        const currentSizes = Stats.currentBuildResults.bundleSizes;
        const recordIndex = currentSizes.findIndex(
          record =>
            record.filename === filename && record.bundleType === bundleType
        );
        const index = recordIndex !== -1 ? recordIndex : currentSizes.length;
        currentSizes[index] = {
          filename,
          bundleType,
          packageName,
          size,
          gzip,
        };
      },
    }),
  ].filter(Boolean);
}

function getPackageName(name) {
  if (name.indexOf('.') !== -1) {
    return name.split('.')[0];
  }
  return name;
}

/**
 * Непосредственно сборка бандла через Rollup
 * @param bundle
 * @param bundleType
 * @returns {Promise<boolean>}
 */
async function createBundle(bundle, bundleType) {
  const filename = getFilename(bundle.entry, bundle.global, bundleType);
  const logKey =
    chalk.white.bold(filename) + chalk.dim(` (${bundleType.toLowerCase()})`);
  const packageName = getPackageName(bundle.entry);

  let resolvedEntry = require.resolve(bundle.entry);
  const peerGlobals = Modules.getPeerGlobals(bundle.externals, bundleType);
  let externals = Object.keys(peerGlobals);

  const importSideEffects = Modules.getImportSideEffects();
  const pureExternalModules = Object.keys(importSideEffects).filter(
    module => !importSideEffects[module]
  );

  const rollupConfig = {
    input: resolvedEntry,
    treeshake: {
      pureExternalModules,
    },
    external(id) {
      return !!peerGlobals[id];
    },
    onwarn: handleRollupWarning,
    plugins: getPlugins(
      bundle.entry,
      externals,
      bundle.babel,
      filename,
      packageName,
      bundleType,
      bundle.global,
      bundle.moduleType,
      pureExternalModules,
      bundle
    )
  };
  const mainOutputPath = `React/third-party/${packageName}/${filename}`;
  const rollupOutputOptions = getRollupOutputOptions(
    mainOutputPath,
    peerGlobals,
    bundle.global,
    bundleType,
    packageName
  );

  if (isWatchMode) {
    rollupConfig.output = [rollupOutputOptions];
    const watcher = rollup.watch(rollupConfig);
    watcher.on('event', async event => {
      switch (event.code) {
        case 'BUNDLE_START':
          console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
          break;
        case 'ERROR':
          console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
          handleRollupError(event.error);
          break;
      }
    });
  } else {
    console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
    try {
      const result = await rollup.rollup(rollupConfig);
      await result.write(rollupOutputOptions);
    } catch (error) {
      console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
      handleRollupError(error);
      throw error;
    }
    console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
  }
}

// Обработка предупреждений в Rollup
function handleRollupWarning(warning) {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
    const match = warning.message.match(/external module '([^']+)'/);
    if (!match || typeof match[1] !== 'string') {
      throw new Error(
        'Could not parse a Rollup warning. ' + 'Fix this method.'
      );
    }
    const importSideEffects = Modules.getImportSideEffects();
    const externalModule = match[1];
    if (typeof importSideEffects[externalModule] !== 'boolean') {
      throw new Error(
        'An external module "' +
        externalModule +
        '" is used in a DEV-only code path ' +
        'but we do not know if it is safe to omit an unused require() to it in production. ' +
        'Please add it to the `importSideEffects` list in `scripts/rollup/modules.js`.'
      );
    }
    // Don't warn. We will remove side effectless require() in a later pass.
    return;
  }

  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    return;
  }

  if (warning.code === 'MISSING_EXPORT' && warning.missing === 'unstable_flushAllWithoutAsserting') {
    return;
  }

  if (typeof warning.code === 'string') {
    // This is a warning coming from Rollup itself
    console.error(warning.message || warning);
    process.exit(1);
  } else {
    // The warning is from one of the plugins.
    console.warn(warning.message || warning);
  }
}

// Обработка ошибок в Rollup
function handleRollupError(error) {
  loggedErrors.add(error);
  if (!error.code) {
    console.error(error);
    return;
  }
  console.error(
    `\x1b[31m-- ${error.code}${error.plugin ? ` (${error.plugin})` : ''} --`
  );
  console.error(error.stack);
  if (error.loc && error.loc.file) {
    const {file, line, column} = error.loc;
    // This looks like an error from Rollup, e.g. missing export.
    // We'll use the accurate line numbers provided by Rollup but
    // use Babel code frame because it looks nicer.
    const rawLines = fs.readFileSync(file, 'utf-8');
    // column + 1 is required due to rollup counting column start position from 0
    // whereas babel-code-frame counts from 1
    const frame = codeFrame(rawLines, line, column + 1, {
      highlightCode: true,
    });
    console.error(frame);
  } else if (error.codeFrame) {
    // This looks like an error from a plugin (e.g. Babel).
    // In this case we'll resort to displaying the provided code frame
    // because we can't be sure the reported location is accurate.
    console.error(error.codeFrame);
  }
}

// Пробегаемся по списку необходимых библиотек и форматов, и асинхронно собираем их
async function buildEverything() {
  let bundles = [];
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of Constants.bundles) {
    bundles.push(
      [bundle, AMD_DEV],
      [bundle, AMD_PROD],
      [bundle, AMD_PROFILING]
    );
  }
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const [bundle, bundleType] of bundles) {
    await createBundle(bundle, bundleType);
  }
}

// Запускаем сборку всех библиотек
buildEverything();
