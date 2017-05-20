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
    'react/lib/getNextDebugID': 'react/lib/getNextDebugIDUMDShim',
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

// What is happening here???
// I'm glad you asked. It became really hard to make our bundle splitting work.
// Everything is fine in node and when bundling with those packages, but when
// using our pre-packaged files, the splitting didn't work. Specifically due to
// the UMD wrappers defining their own require and creating their own encapsulated
// "registry" scope, we couldn't require across the boundaries. Webpack tries to
// be smart and looks for top-level requires (even when aliasing to a bundle),
// but since we didn't have those, we couldn't require 'react' from 'react-dom'.
// But we are already shimming in some modules that look for a global React
// variable. So we replace the UMD wrapper that browserify creates with out own,
// in 2 steps.
// 1. We swap out the browserify UMD with a plain function call. This ensures
// that the internal wrapper doesn't interact with the external state. By the
// time we're in the internal wrapper it doesn't matter what the external wrapper
// detected. Browserify insulates its CommonJS system inside closures so can just
// call that function and return it.
// 2. We put our own UMD wrapper around that fixed internal function, ensuring
// React is in scope. This outer wrapper is essentially the same UMD wrapper
// browserify would create, just handling the scope issue.
// Is this insane? Yes.
// Does it work? Yes.
// Should it go away ASAP? Yes.
function wrapperify(src) {
  var toReplace =
    `function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.${this.data.standalone} = f()}}`;
  if (src.indexOf(toReplace) === -1) {
    throw new Error('wrapperify failed to find code to replace');
  }
  src = src.replace(
    toReplace,
    `function(f){return f()}`
  );
  return `
;(function(f) {
  // CommonJS
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f(require('react'));

  // RequireJS
  } else if (typeof define === "function" && define.amd) {
    define(['react'], f);

  // <script>
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      // works providing we're not in "use strict";
      // needed for Java 8 Nashorn
      // see https://github.com/facebook/react/issues/3037
      g = this;
    }
    g.${this.data.standalone} = f(g.React);
  }
})(function(React) {
  return ${src}
});
`;
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
  after: [derequire, wrapperify, simpleBannerify],
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

  after: [wrapperify, minify, bannerify],
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
  after: [derequire, wrapperify, simpleBannerify],
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

  after: [wrapperify, minify, bannerify],
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
  after: [derequire, wrapperify, simpleBannerify],
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

  after: [wrapperify, minify, bannerify],
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
