'use strict';

var Funnel = require('broccoli-funnel');
var htmlReplace = require('../html-replace');
var jsReplace = require('../js-replace');
var path = require('path');
var stew = require('broccoli-stew');

import compileWithTypescript from '../broccoli-typescript';
import destCopy from '../broccoli-dest-copy';
import flatten from '../broccoli-flatten';
import mergeTrees from '../broccoli-merge-trees';
import replace from '../broccoli-replace';
import checkImports from '../broccoli-check-imports';


const kServedPaths = [
  // Relative (to /modules) paths to benchmark directories
  'benchmarks/src',
  'benchmarks/src/change_detection',
  'benchmarks/src/compiler',
  'benchmarks/src/costs',
  'benchmarks/src/di',
  'benchmarks/src/element_injector',
  'benchmarks/src/largetable',
  'benchmarks/src/naive_infinite_scroll',
  'benchmarks/src/page_load',
  'benchmarks/src/tree',
  'benchmarks/src/static_tree',

  // Relative (to /modules) paths to external benchmark directories
  'benchmarks_external/src',
  'benchmarks_external/src/compiler',
  'benchmarks_external/src/largetable',
  'benchmarks_external/src/naive_infinite_scroll',
  'benchmarks_external/src/tree',
  'benchmarks_external/src/tree/react',
  'benchmarks_external/src/static_tree',

  // Relative (to /modules) paths to example directories
  'playground/src/animate',
  'playground/src/benchpress',
  'playground/src/model_driven_forms',
  'playground/src/template_driven_forms',
  'playground/src/person_management',
  'playground/src/order_management',
  'playground/src/gestures',
  'playground/src/hash_routing',
  'playground/src/hello_world',
  'playground/src/http',
  'playground/src/jsonp',
  'playground/src/key_events',
  'playground/src/relative_assets',
  'playground/src/routing',
  'playground/src/alt_routing',
  'playground/src/sourcemap',
  'playground/src/svg',
  'playground/src/todo',
  'playground/src/upgrade',
  'playground/src/zippy_component',
  'playground/src/async',
  'playground/src/web_workers/kitchen_sink',
  'playground/src/web_workers/todo',
  'playground/src/web_workers/images',
  'playground/src/web_workers/message_broker',
  'playground/src/web_workers/router',
  'playground/src/web_workers/input',
];


module.exports = function makeBrowserTree(options: any, destinationPath: string) {
  // TODO: define an interface for the options
  const modules = options.projects;
  const noTypeChecks = options.noTypeChecks;
  const generateEs6 = options.generateEs6;
  const sourceMaps = options.sourceMaps;
  const useBundles = options.useBundles;

  if (modules.angular2) {
    var angular2Tree = new Funnel('modules/angular2', {
      include: ['**/**'],
      exclude: [
        // Exclude ES6 polyfill typings when tsc target=ES6
        'typings/es6-*/**',
      ],
      destDir: '/angular2/'
    });
  }

  if (modules.benchmarks) {
    var benchmarksTree = new Funnel(
        'modules/benchmarks',
        {include: ['**/**'], exclude: ['e2e_test/**'], destDir: '/benchmarks/'});
  }

  if (modules.benchmarks_external) {
    var benchmarksExternalTree = new Funnel(
        'modules/benchmarks_external',
        {include: ['**/**'], exclude: ['e2e_test/**'], destDir: '/benchmarks_external/'});
  }

  if (modules.payload_tests) {
    var payloadTestsTree = new Funnel(
        'modules/payload_tests',
        {include: ['**/ts/**'], exclude: ['e2e_test/**'], destDir: '/payload_tests/'});
  }

  if (modules.playground) {
    var playgroundTree = new Funnel(
        'modules/playground',
        {include: ['**/**'], exclude: ['e2e_test/**'], destDir: '/playground/'});
  }

  if (modules.benchpress) {
    var benchpressTree = new Funnel(
        'modules/benchpress',
        {include: ['**/**'], exclude: ['e2e_test/**'], destDir: '/benchpress/'});
  }

  let externalTypings =
      new Funnel('node_modules', {include: ['rxjs/**/*.d.ts', 'zone.js/**/*.d.ts']});


  var modulesTree = mergeTrees([
    angular2Tree,
    benchmarksTree,
    benchmarksExternalTree,
    payloadTestsTree,
    playgroundTree,
    benchpressTree,
    externalTypings,
  ]);

  var es6PolyfillTypings =
      new Funnel('modules', {include: ['angular2/typings/es6-*/**'], destDir: '/'});

  var es5ModulesTree = mergeTrees([modulesTree, es6PolyfillTypings]);

  var scriptPathPatternReplacement = {
    match: '@@PATH',
    replacement: function(replacement: string, relativePath: string) {
      var parts = relativePath.replace(/\\/g, '/').split('/');
      return parts.splice(0, parts.length - 1).join('/');
    }
  };

  var scriptFilePatternReplacement = {
    match: '@@FILENAME',
    replacement: function(replacement: string, relativePath: string) {
      var parts = relativePath.replace(/\\/g, '/').split('/');
      return parts[parts.length - 1].replace('html', 'js');
    }
  };

  var useBundlesPatternReplacement = {
    match: '@@USE_BUNDLES',
    replacement: function(replacement: string, relativePath: string) { return useBundles; }
  };

  // Check that imports do not break barrel boundaries
  modulesTree = checkImports(modulesTree);

  modulesTree = replace(modulesTree, {
    files: ['playground*/**/*.js'],
    patterns: [{match: /\$SCRIPTS\$/, replacement: jsReplace('SCRIPTS')}]
  });

  let ambientTypings = [
    'angular2/typings/hammerjs/hammerjs.d.ts',
    'angular2/typings/node/node.d.ts',
    'node_modules/zone.js/dist/zone.js.d.ts',
    'angular2/manual_typings/globals.d.ts',
    'angular2/typings/es6-collections/es6-collections.d.ts',
    'angular2/typings/es6-promise/es6-promise.d.ts',
  ];

  // Use TypeScript to transpile the *.ts files to ES5
  var es5Tree = compileWithTypescript(es5ModulesTree, {
    declaration: false,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    module: 'commonjs',
    moduleResolution: 'classic',
    noEmitOnError: !noTypeChecks,
    rootDir: './',
    rootFilePaths: ambientTypings,
    inlineSourceMap: sourceMaps,
    inlineSources: sourceMaps,
    target: 'es5'
  });

  var vendorScriptsTree = flatten(new Funnel('.', {
    files: [
      'node_modules/es6-shim/es6-shim.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/long-stack-trace-zone.js',
      'node_modules/systemjs/dist/system.src.js',
      'node_modules/base64-js/lib/b64.js',
      'node_modules/reflect-metadata/Reflect.js',
    ]
  }));

  var vendorScripts_benchmark =
      new Funnel('tools/build/snippets', {files: ['url_params_to_form.js'], destDir: '/'});
  var vendorScripts_benchmarks_external =
      new Funnel('node_modules/angular', {files: ['angular.js'], destDir: '/'});

  // Get scripts for each benchmark or example
  let servingTrees = kServedPaths.reduce(getServedFunnels, []);
  function getServedFunnels(funnels: BroccoliTree[], destDir: string) {
    let options = {srcDir: '/', destDir: destDir};
    funnels.push(new Funnel(vendorScriptsTree, options));
    if (destDir.indexOf('benchmarks') > -1) {
      funnels.push(new Funnel(vendorScripts_benchmark, options));
    }
    if (destDir.indexOf('benchmarks_external') > -1) {
      funnels.push(new Funnel(vendorScripts_benchmarks_external, options));
    }
    return funnels;
  }


  if (modules.benchmarks || modules.benchmarks_external || modules.playground) {
    var assetsTree = new Funnel(
        modulesTree, {include: ['**/*'], exclude: ['**/*.{html,ts,dart}'], destDir: '/'});
  }

  var htmlTree = new Funnel(modulesTree, {
    include: ['*/src/**/*.html', '**/playground/**/*.html', '**/payload_tests/**/ts/**/*.html'],
    destDir: '/'
  });

  if (modules.playground) {
    htmlTree = replace(htmlTree, {
      files: ['playground*/**/*.html'],
      patterns: [
        {match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS')}, scriptPathPatternReplacement,
        scriptFilePatternReplacement, useBundlesPatternReplacement
      ]
    });
  }

  if (modules.benchmarks) {
    htmlTree = replace(htmlTree, {
      files: ['benchmarks/**'],
      patterns: [
        {match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS_benchmarks')},
        scriptPathPatternReplacement, scriptFilePatternReplacement, useBundlesPatternReplacement
      ]
    });
  }

  if (modules.benchmarks_external) {
    htmlTree = replace(htmlTree, {
      files: ['benchmarks_external/**'],
      patterns: [
        {match: /\$SCRIPTS\$/, replacement: htmlReplace('SCRIPTS_benchmarks_external')},
        scriptPathPatternReplacement, scriptFilePatternReplacement, useBundlesPatternReplacement
      ]
    });
  }

  if (modules.playground) {
    // We need to replace the regular angular bundle with the web-worker bundle
    // for web-worker e2e tests.
    htmlTree = replace(htmlTree, {
      files: ['playground*/**/web_workers/**/*.html'],
      patterns: [{match: '/bundle/angular2.dev.js', replacement: '/bundle/web_worker/ui.dev.js'}]
    });
  }

  if (modules.benchmarks || modules.benchmarks_external) {
    var scripts = mergeTrees(servingTrees);
  }

  if (modules.benchmarks_external) {
    var polymerFiles = new Funnel('.', {
      files: [
        'bower_components/polymer/polymer.html',
        'bower_components/polymer/polymer-micro.html',
        'bower_components/polymer/polymer-mini.html',
        'tools/build/snippets/url_params_to_form.js',
      ]
    });
    var polymer = stew.mv(flatten(polymerFiles), 'benchmarks_external/src/tree/polymer');

    var reactFiles = new Funnel('.', {files: ['node_modules/react/dist/react.min.js']});
    var react = stew.mv(flatten(reactFiles), 'benchmarks_external/src/tree/react');
  }

  if (modules.benchmarks || modules.benchmarks_external || modules.playground) {
    htmlTree = mergeTrees([htmlTree, scripts, polymer, react]);
  }

  // this is needed only for creating a bundle
  // typescript resolves dependencies automatically
  if (modules.bundle_deps) {
    var nodeModules = new Funnel(
        'node_modules', {include: ['rxjs/**/**', 'parse5/**/**', 'css/**/**'], destDir: '/'});
  }

  if (generateEs6) {
    // Use TypeScript to transpile the *.ts files to ES6
    var es6Tree = compileWithTypescript(modulesTree, {
      declaration: false,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      noEmitOnError: false,
      rootDir: './',
      rootFilePaths: [
        'angular2/typings/zone.js/zone.js.d.ts',
        'angular2/typings/hammerjs/hammerjs.d.ts',
        'angular2/typings/node/node.d.ts',
      ],
      inlineSourceMap: sourceMaps,
      inlineSources: sourceMaps,
      target: 'es6'
    });

    es6Tree = stew.mv(mergeTrees([es6Tree, htmlTree, assetsTree, nodeModules]), '/es6');
  }
  es5Tree = stew.mv(mergeTrees([es5Tree, htmlTree, assetsTree, nodeModules]), '/es5');

  var mergedTree = mergeTrees([es6Tree, es5Tree]);
  return destCopy(mergedTree, destinationPath);
};
