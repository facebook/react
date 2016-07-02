/*eslint-disable no-multi-str */

'use strict';

var envify = require('loose-envify/custom');
var grunt = require('grunt');
var UglifyJS = require('uglify-js');
var uglifyify = require('uglifyify');
var derequire = require('derequire');
var globalShim = require('browserify-global-shim');
var collapser = require('bundle-collapser/plugin');

var envifyDev = envify({NODE_ENV: process.env.NODE_ENV || 'development'});
var envifyProd = envify({NODE_ENV: process.env.NODE_ENV || 'production'});

var SECRET_INTERNALS_NAME = 'React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED';
var SECRET_DOM_INTERNALS_NAME = 'ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED';

var shimSharedModules = globalShim.configure({
  './ReactCurrentOwner': SECRET_INTERNALS_NAME + '.ReactCurrentOwner',
  './ReactComponentTreeHook': SECRET_INTERNALS_NAME + '.ReactComponentTreeHook',
  // All these methods are shared are exposed.
  './ReactElement': 'React',
  './ReactPropTypes': 'React.PropTypes',
  './ReactChildren': 'React.Children',
});

// Shim references to ReactDOM internals from addons.
var shimDOM = globalShim.configure({
  './ReactDOM': 'ReactDOM',
  './ReactInstanceMap': SECRET_DOM_INTERNALS_NAME + '.ReactInstanceMap',

  // TestUtils pulls in a bunch of internals.
  './EventConstants': SECRET_DOM_INTERNALS_NAME + '.EventConstants',
  './EventPluginHub': SECRET_DOM_INTERNALS_NAME + '.EventPluginHub',
  './EventPluginRegistry': SECRET_DOM_INTERNALS_NAME + '.EventPluginRegistry',
  './EventPropagators': SECRET_DOM_INTERNALS_NAME + '.EventPropagators',
  './ReactDefaultInjection': SECRET_DOM_INTERNALS_NAME + '.ReactDefaultInjection',
  './ReactDOMComponentTree': SECRET_DOM_INTERNALS_NAME + '.ReactDOMComponentTree',
  './ReactBrowserEventEmitter': SECRET_DOM_INTERNALS_NAME + '.ReactBrowserEventEmitter',
  './ReactCompositeComponent': SECRET_DOM_INTERNALS_NAME + '.ReactCompositeComponent',
  './ReactInstrumentation': SECRET_DOM_INTERNALS_NAME + '.ReactInstrumentation',
  './ReactReconciler': SECRET_DOM_INTERNALS_NAME + '.ReactReconciler',
  './ReactUpdates': SECRET_DOM_INTERNALS_NAME + '.ReactUpdates',
  './SyntheticEvent': SECRET_DOM_INTERNALS_NAME + '.SyntheticEvent',
  './findDOMNode': SECRET_DOM_INTERNALS_NAME + '.findDOMNode',
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
    './build/modules/ReactUMDEntry.js',
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
    './build/modules/ReactUMDEntry.js',
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
    './build/modules/ReactWithAddonsUMDEntry.js',
  ],
  outfile: './build/react-with-addons.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [shimDOM],
  globalTransforms: [envifyDev],
  plugins: [collapser],
  after: [derequire, simpleBannerify],
};

var addonsMin = {
  entries: [
    './build/modules/ReactWithAddonsUMDEntry.js',
  ],
  outfile: './build/react-with-addons.min.js',
  debug: false,
  standalone: 'React',
  packageName: 'React (with addons)',
  transforms: [shimDOM, envifyProd, uglifyify],
  globalTransforms: [envifyProd],
  plugins: [collapser],
  // No need to derequire because the minifier will mangle
  // the "require" calls.

  after: [minify, bannerify],
};

// The DOM Builds
var dom = {
  entries: [
    './build/modules/ReactDOMUMDEntry.js',
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
    './build/modules/ReactDOMUMDEntry.js',
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
    './build/modules/ReactDOMServerUMDEntry.js',
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
    './build/modules/ReactDOMServerUMDEntry.js',
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

module.exports = {
  basic: basic,
  min: min,
  addons: addons,
  addonsMin: addonsMin,
  dom: dom,
  domMin: domMin,
  domServer: domServer,
  domServerMin: domServerMin,
};
