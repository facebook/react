/*eslint-disable no-multi-str */

'use strict';

var envify = require('loose-envify/custom');
var grunt = require('grunt');
var UglifyJS = require('uglify-js');
var uglifyify = require('uglifyify');
var derequire = require('derequire');
var aliasify = require('aliasify');
var collapser = require('bundle-collapser/plugin');

var envifyDev = envify({NODE_ENV: process.env.NODE_ENV || 'development'});
var envifyProd = envify({NODE_ENV: process.env.NODE_ENV || 'production'});

var shimSharedModules = aliasify.configure({
  'aliases': {
    'react/lib/React': 'react/lib/ReactUMDShim',
    'react/lib/ReactCurrentOwner': 'react/lib/ReactCurrentOwnerUMDShim',
    'react/lib/ReactComponentTreeHook': 'react/lib/ReactComponentTreeHookUMDShim',
  },
});

var shimDOMModules = aliasify.configure({
  'aliases': {
    './ReactAddonsDOMDependencies': {relative: './ReactAddonsDOMDependenciesUMDShim'},
  },
});

var SIMPLE_TEMPLATE =
  grunt.file.read('./grunt/data/header-template-short.txt');

var LICENSE_TEMPLATE =
  grunt.file.read('./grunt/data/header-template-extended.txt');

function minify(src) {
  return UglifyJS.minify(src, {fromString: true}).code;
}

// TODO: move this out to another build step maybe.
function bannerify(src) {
  var version = grunt.config.data.pkg.version;
  var packageName = this.data.packageName || this.data.standalone;
  return (
    grunt.template.process(
      LICENSE_TEMPLATE,
      {data: {package: packageName, version: version}}
    ) +
    src
  );
}

function simpleBannerify(src) {
  var version = grunt.config.data.pkg.version;
  var packageName = this.data.packageName || this.data.standalone;
  return (
    grunt.template.process(
      SIMPLE_TEMPLATE,
      {data: {package: packageName, version: version}}
    ) +
    src
  );
}

// Our basic config which we'll add to to make our other builds
var basic = {
  entries: [
    './build/node_modules/react/lib/ReactUMDEntry.js',
  ],
  outfile: './build/react.js',
  debug: false,
  standalone: 'React',
  // Apply as global transform so that we also envify fbjs and any other deps
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var min = {
  entries: [
    './build/node_modules/react/lib/ReactUMDEntry.js',
  ],
  outfile: './build/react.min.js',
  debug: false,
  standalone: 'React',
  // Envify twice. The first ensures that when we uglifyify, we have the right
  // conditions to exclude requires. The global transform runs on deps.
  transforms: [envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

var addons = {
  entries: [
    './build/node_modules/react/lib/ReactWithAddonsUMDEntry.js',
  ],
  outfile: './build/react-with-addons.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [shimDOMModules],
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var addonsMin = {
  entries: [
    './build/node_modules/react/lib/ReactWithAddonsUMDEntry.js',
  ],
  outfile: './build/react-with-addons.min.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [shimDOMModules, envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

// The DOM Builds
var dom = {
  entries: [
    './build/node_modules/react-dom/lib/ReactDOMUMDEntry.js',
  ],
  outfile: './build/react-dom.js',
  debug: false,
  standalone: 'ReactDOM',
  // Apply as global transform so that we also envify fbjs and any other deps
  transforms: [shimSharedModules],
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var domMin = {
  entries: [
    './build/node_modules/react-dom/lib/ReactDOMUMDEntry.js',
  ],
  outfile: './build/react-dom.min.js',
  debug: false,
  standalone: 'ReactDOM',
  // Envify twice. The first ensures that when we uglifyify, we have the right
  // conditions to exclude requires. The global transform runs on deps.
  transforms: [shimSharedModules, envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

var domServer = {
  entries: [
    './build/node_modules/react-dom/lib/ReactDOMServerUMDEntry.js',
  ],
  outfile: './build/react-dom-server.js',
  debug: false,
  standalone: 'ReactDOMServer',
  // Apply as global transform so that we also envify fbjs and any other deps
  transforms: [shimSharedModules],
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var domServerMin = {
  entries: [
    './build/node_modules/react-dom/lib/ReactDOMServerUMDEntry.js',
  ],
  outfile: './build/react-dom-server.min.js',
  debug: false,
  standalone: 'ReactDOMServer',
  // Envify twice. The first ensures that when we uglifyify, we have the right
  // conditions to exclude requires. The global transform runs on deps.
  transforms: [shimSharedModules, envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

var domFiber = {
  entries: [
    './build/node_modules/react-dom/lib/ReactDOMFiber.js',
  ],
  outfile: './build/react-dom-fiber.js',
  debug: false,
  standalone: 'ReactDOMFiber',
  // Apply as global transform so that we also envify fbjs and any other deps
  transforms: [shimSharedModules],
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var domFiberMin = {
  entries: [
    './build/node_modules/react-dom/lib/ReactDOMFiber.js',
  ],
  outfile: './build/react-dom-fiber.min.js',
  debug: false,
  standalone: 'ReactDOMFiber',
  // Envify twice. The first ensures that when we uglifyify, we have the right
  // conditions to exclude requires. The global transform runs on deps.
  transforms: [shimSharedModules, envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

module.exports = {
  basic: basic,
  min: min,
  addons: addons,
  addonsMin: addonsMin,
  dom: dom,
  domMin: domMin,
  domServer: domServer,
  domServerMin: domServerMin,
  domFiber: domFiber,
  domFiberMin: domFiberMin,
};
