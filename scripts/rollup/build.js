'use strict';

const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const alias = require('rollup-plugin-alias');
const uglify = require('rollup-plugin-uglify');
const replace = require('rollup-plugin-replace');
const chalk = require('chalk');
const escapeStringRegexp = require('escape-string-regexp');
const join = require('path').join;
const resolve = require('path').resolve;
const fs = require('fs');
const rimraf = require('rimraf');
const argv = require('minimist')(process.argv.slice(2));
const Modules = require('./modules');
const Bundles = require('./bundles');
const propertyMangleWhitelist = require('./mangle').propertyMangleWhitelist;
const sizes = require('./plugins/sizes-plugin');
const Stats = require('./stats');
const Packaging = require('./packaging');
const Header = require('./header');

const UMD_DEV = Bundles.bundleTypes.UMD_DEV;
const UMD_PROD = Bundles.bundleTypes.UMD_PROD;
const NODE_DEV = Bundles.bundleTypes.NODE_DEV;
const NODE_PROD = Bundles.bundleTypes.NODE_PROD;
const FB_DEV = Bundles.bundleTypes.FB_DEV;
const FB_PROD = Bundles.bundleTypes.FB_PROD;
const RN_DEV = Bundles.bundleTypes.RN_DEV;
const RN_PROD = Bundles.bundleTypes.RN_PROD;

const reactVersion = require('../../package.json').version;
const requestedBundleTypes = (argv.type || '')
  .split(',')
  .map(type => type.toUpperCase());
const requestedBundleNames = (argv._[0] || '')
  .split(',')
  .map(type => type.toLowerCase());

// used for when we property mangle with uglify/gcc
const mangleRegex = new RegExp(
  `^(?${propertyMangleWhitelist
    .map(prop => `!${escapeStringRegexp(prop)}`)
    .join('|')}$).*$`,
  'g'
);

function getBanner(bundleType, hasteName, filename) {
  switch (bundleType) {
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      let hasteFinalName = hasteName;
      switch (bundleType) {
        case FB_DEV:
          hasteFinalName += '-dev';
          break;
        case FB_PROD:
          hasteFinalName += '-prod';
          break;
      }
      const fbDevCode = `\n\n'use strict';\n\n` + `\nif (__DEV__) {\n`;
      return Header.getProvidesHeader(hasteFinalName, bundleType, fbDevCode);
    case UMD_DEV:
    case UMD_PROD:
      return Header.getUMDHeader(filename, reactVersion);
    default:
      return '';
  }
}

function getFooter(bundleType) {
  if (bundleType === FB_DEV) {
    return '\n}\n';
  }
  return '';
}

function updateBabelConfig(babelOpts, bundleType) {
  let newOpts;

  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
    case RN_DEV:
    case RN_PROD:
      newOpts = Object.assign({}, babelOpts);
      // we add the objectAssign transform for these bundles
      newOpts.plugins = newOpts.plugins.slice();
      newOpts.plugins.push(
        resolve('./scripts/babel/transform-object-assign-require')
      );
      return newOpts;
    case FB_DEV:
    case FB_PROD:
      newOpts = Object.assign({}, babelOpts);
      // for FB, we don't want the devExpressionWithCodes plugin to run
      newOpts.plugins = [];
      return newOpts;
  }
}

function handleRollupWarnings(warning) {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    console.error(warning.message);
    process.exit(1);
  }
  console.warn(warning.message || warning);
}

function updateBundleConfig(config, filename, format, bundleType, hasteName) {
  return Object.assign({}, config, {
    banner: getBanner(bundleType, hasteName, filename),
    dest: Packaging.getPackageDestination(config, bundleType, filename),
    footer: getFooter(bundleType),
    format,
    interop: false,
  });
}

function stripEnvVariables(production) {
  return {
    __DEV__: production ? 'false' : 'true',
    'process.env.NODE_ENV': production ? "'production'" : "'development'",
  };
}

function getFormat(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
      return `umd`;
    case NODE_DEV:
    case NODE_PROD:
    case FB_DEV:
    case FB_PROD:
    case RN_DEV:
    case RN_PROD:
      return `cjs`;
  }
}

function getFilename(name, hasteName, bundleType) {
  // we do this to replace / to -, for react-dom/server
  name = name.replace('/', '-');
  switch (bundleType) {
    case UMD_DEV:
      return `${name}.development.js`;
    case UMD_PROD:
      return `${name}.production.min.js`;
    case NODE_DEV:
      return `${name}.development.js`;
    case NODE_PROD:
      return `${name}.production.min.js`;
    case FB_DEV:
    case RN_DEV:
      return `${hasteName}-dev.js`;
    case FB_PROD:
    case RN_PROD:
      return `${hasteName}-prod.js`;
  }
}

function uglifyConfig(mangle, manglePropertiesOnProd, preserveVersionHeader) {
  return {
    warnings: false,
    compress: {
      screw_ie8: true,
      dead_code: true,
      unused: true,
      drop_debugger: true,
      // we have a string literal <script> that we don't want to evaluate
      // for FB prod bundles (where we disable mangling)
      evaluate: mangle,
      booleans: true,
      // Our www inline transform combined with Jest resetModules is confused
      // in some rare cases unless we keep all requires at the top:
      hoist_funs: mangle,
    },
    output: {
      beautify: !mangle,
      comments(node, comment) {
        if (preserveVersionHeader && comment.pos === 0 && comment.col === 0) {
          // Keep the very first comment (the bundle header) in prod bundles.
          if (comment.value.indexOf(reactVersion) === -1) {
            // Sanity check: this doesn't look like the bundle header!
            throw new Error(
              'Expected the first comment to be the file header but got: ' +
                comment.value
            );
          }
          return true;
        }
        // Keep all comments in FB bundles.
        return !mangle;
      },
    },
    mangleProperties: mangle && manglePropertiesOnProd
      ? {
          ignore_quoted: true,
          regex: mangleRegex,
        }
      : false,
    mangle: mangle
      ? {
          toplevel: true,
          screw_ie8: true,
        }
      : false,
  };
}

function getCommonJsConfig(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case NODE_DEV:
    case NODE_PROD:
      return {};
    case RN_DEV:
    case RN_PROD:
      return {
        ignore: Modules.ignoreReactNativeModules(),
      };
    case FB_DEV:
    case FB_PROD:
      // Modules we don't want to inline in the bundle.
      // Force them to stay as require()s in the output.
      return {
        ignore: Modules.ignoreFBModules(),
      };
  }
}

function getPlugins(
  entry,
  babelOpts,
  paths,
  filename,
  bundleType,
  isRenderer,
  manglePropertiesOnProd
) {
  const plugins = [
    replace(Modules.getDefaultReplaceModules(bundleType)),
    babel(updateBabelConfig(babelOpts, bundleType)),
    alias(
      Modules.getAliases(paths, bundleType, isRenderer, argv.extractErrors)
    ),
  ];
  switch (bundleType) {
    case UMD_DEV:
    case NODE_DEV:
    case FB_DEV:
    case RN_DEV:
      plugins.push(
        replace(stripEnvVariables(false)),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType))
      );
      break;
    case UMD_PROD:
    case NODE_PROD:
    case FB_PROD:
    case RN_PROD:
      plugins.push(
        replace(stripEnvVariables(true)),
        // needs to happen after strip env
        commonjs(getCommonJsConfig(bundleType)),
        uglify(
          uglifyConfig(
            bundleType !== FB_PROD,
            manglePropertiesOnProd,
            bundleType === UMD_PROD
          )
        )
      );
      break;
  }
  // this needs to come last or it doesn't report sizes correctly
  plugins.push(
    sizes({
      getSize: (size, gzip) => {
        const key = `${filename} (${bundleType})`;
        Stats.currentBuildResults.bundleSizes[key] = {
          size,
          gzip,
        };
      },
    })
  );

  return plugins;
}

function createBundle(bundle, bundleType) {
  const shouldSkipBundleType = bundle.bundleTypes.indexOf(bundleType) === -1;
  if (shouldSkipBundleType) {
    return Promise.resolve();
  }
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      requestedType => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return Promise.resolve();
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      requestedName => bundle.label.indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return Promise.resolve();
    }
  }

  const filename = getFilename(bundle.name, bundle.hasteName, bundleType);
  const logKey = chalk.white.bold(filename) +
    chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.name);

  console.log(`${chalk.bgYellow.black(' STARTING ')} ${logKey}`);
  return rollup({
    entry: bundleType === FB_DEV || bundleType === FB_PROD
      ? bundle.fbEntry
      : bundle.entry,
    external: Modules.getExternalModules(
      bundle.externals,
      bundleType,
      bundle.isRenderer
    ),
    onwarn: handleRollupWarnings,
    plugins: getPlugins(
      bundle.entry,
      bundle.babelOpts,
      bundle.paths,
      filename,
      bundleType,
      bundle.isRenderer,
      bundle.manglePropertiesOnProd
    ),
  })
    .then(result =>
      result.write(
        updateBundleConfig(
          bundle.config,
          filename,
          format,
          bundleType,
          bundle.hasteName
        )
      ))
    .then(() => Packaging.createNodePackage(bundleType, packageName, filename))
    .then(() => {
      console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
    })
    .catch(error => {
      if (error.code) {
        console.error(`\x1b[31m-- ${error.code} (${error.plugin}) --`);
        console.error(error.message);
        console.error(error.loc);
        console.error(error.codeFrame);
      } else {
        console.error(error);
      }
      process.exit(1);
    });
}

// clear the build directory
rimraf('build', () => {
  // create a new build directory
  fs.mkdirSync('build');
  // create the packages folder for NODE+UMD bundles
  fs.mkdirSync(join('build', 'packages'));
  // create the dist folder for UMD bundles
  fs.mkdirSync(join('build', 'dist'));

  const tasks = [
    Packaging.createFacebookWWWBuild,
    Packaging.createReactNativeBuild,
  ];
  for (const bundle of Bundles.bundles) {
    tasks.push(
      () => createBundle(bundle, UMD_DEV),
      () => createBundle(bundle, UMD_PROD),
      () => createBundle(bundle, NODE_DEV),
      () => createBundle(bundle, NODE_PROD),
      () => createBundle(bundle, FB_DEV),
      () => createBundle(bundle, FB_PROD),
      () => createBundle(bundle, RN_DEV),
      () => createBundle(bundle, RN_PROD)
    );
  }
  // rather than run concurently, opt to run them serially
  // this helps improve console/warning/error output
  // and fixes a bunch of IO failures that sometimes occured
  return runWaterfall(tasks)
    .then(() => {
      // output the results
      console.log(Stats.printResults());
      // save the results for next run
      Stats.saveResults();
      if (argv.extractErrors) {
        console.warn(
          '\nWarning: this build was created with --extractErrors enabled.\n' +
            'this will result in extremely slow builds and should only be\n' +
            'used when the error map needs to be rebuilt.\n'
        );
      }
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
});

function runWaterfall(promiseFactories) {
  if (promiseFactories.length === 0) {
    return Promise.resolve();
  }

  const head = promiseFactories[0];
  const tail = promiseFactories.slice(1);

  const nextPromiseFactory = head;
  const nextPromise = nextPromiseFactory();
  if (!nextPromise || typeof nextPromise.then !== 'function') {
    throw new Error('runWaterfall() received something that is not a Promise.');
  }

  return nextPromise.then(() => {
    return runWaterfall(tail);
  });
}
