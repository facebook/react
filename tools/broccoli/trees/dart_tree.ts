'use strict';

import {MultiCopy} from './../multi_copy';
import destCopy from '../broccoli-dest-copy';
var Funnel = require('broccoli-funnel');
import mergeTrees from '../broccoli-merge-trees';
var path = require('path');
import renderLodashTemplate from '../broccoli-lodash';
var stew = require('broccoli-stew');
import ts2dart from '../broccoli-ts2dart';
import dartfmt from '../broccoli-dartfmt';
import replace from '../broccoli-replace';
import {AngularBuilderOptions} from '../angular_builder';
import generateForTest from '../broccoli-generate-for-test';

var global_excludes = [
  'angular2/examples/**/ts/**/*',
  'angular2/http*',
  'angular2/http/**/*',
  'angular2/src/http/**/*',
  'angular2/src/upgrade/**/*',
  'angular2/test/http/**/*',
  'angular2/test/upgrade/**/*',
  'angular2/upgrade*',
  'payload_tests/**/ts/**/*',
  'playground/src/http/**/*',
  'playground/src/jsonp/**/*',
  'playground/test/http/**/*',
  'playground/test/jsonp/**/*',
];


/**
 * A funnel starting at modules, including the given filters, and moving into the root.
 * @param include Include glob filters.
 */
function modulesFunnel(include: string[], exclude?: string[]) {
  exclude = exclude || [];
  exclude = exclude.concat(global_excludes);
  return new Funnel('modules', {include, destDir: '/', exclude});
}

/**
 * Replaces $SCRIPT$ in .html files with actual <script> tags.
 */
function replaceScriptTagInHtml(placeholder: string, relativePath: string): string {
  var scriptTags = '';
  if (relativePath.match(/^benchmarks/)) {
    scriptTags += '<script src="url_params_to_form.js" type="text/javascript"></script>\n';
  }
  var scriptName = relativePath.replace(/\\/g, '/').replace(/.*\/([^/]+)\.html$/, '$1.dart');
  scriptTags += '<script src="' + scriptName + '" type="application/dart"></script>\n' +
      '<script src="packages/browser/dart.js" type="text/javascript"></script>';
  return scriptTags;
}

function stripModulePrefix(relativePath: string): string {
  if (!relativePath.match(/^modules\//)) {
    throw new Error('Expected path to root at modules/: ' + relativePath);
  }
  return relativePath.replace(/^modules\//, '');
}

function getSourceTree(options: AngularBuilderOptions) {
  var tsInputTree = modulesFunnel(
      [
        'tsconfig-ts2dart.json',
        'upgrade-ts2dart.d.ts',
        'zone-ts2dart.d.ts',
        '**/*.js',
        '**/*.ts',
        '**/*.dart',
      ],
      [
        'rollup-test/**/*',
        'angular1_router/**/*',
        'angular2/upgrade/**/*',
        'angular2/core/test/typings.d.ts',
        'angular2/manual_typings/globals.d.ts',
        'angular2/typings/es6-collections/es6-collections.d.ts',
        'angular2/typings/es6-promise/es6-promise.d.ts',
        'angular2/typings/tsd.d.ts',
        'angular2/typings.d.ts',
      ]);
  var transpiled = ts2dart(tsInputTree, {
    generateLibraryName: true,
    generateSourceMap: false,
    translateBuiltins: true,
    tsconfig: 'tsconfig-ts2dart.json'
  });

  // Native sources, dart only examples, etc.
  var dartSrcs = modulesFunnel(
      ['**/*.dart', '**/*.ng_meta.json', '**/*.aliases.json', '**/css/**', '**/*.css']);

  var compiledTree = mergeTrees([transpiled, dartSrcs]);

  // Generate test files
  let generatedDartTestFiles = generateForTest(
      mergeTrees([compiledTree, new Funnel('packages', {include: ['path/**', 'stack_trace/**']})]),
      {files: ['*/test/**/*_codegen_typed.dart'], dartPath: options.dartSDK.VM});

  return mergeTrees([compiledTree, generatedDartTestFiles], {overwrite: true});
}

function fixDartFolderLayout(sourceTree: BroccoliTree) {
  // Move around files to match Dart's layout expectations.
  return stew.rename(sourceTree, function(relativePath: string) {
    // If a file matches the `pattern`, insert the given `insertion` as the second path part.
    var replacements = [
      {pattern: /^benchmarks\/test\//, insertion: ''},
      {pattern: /^benchmarks\//, insertion: 'web'},
      {pattern: /^benchmarks_external\/test\//, insertion: ''},
      {pattern: /^benchmarks_external\//, insertion: 'web'},
      {pattern: /^playground\/test\//, insertion: ''},
      {pattern: /^playground\//, insertion: 'web/'},
      {pattern: /^[^\/]*\/test\//, insertion: ''},
      // catch all.
      {pattern: /^./, insertion: 'lib'},
    ];

    for (var i = 0; i < replacements.length; i++) {
      var repl = replacements[i];
      if (relativePath.match(repl.pattern)) {
        var parts = relativePath.split('/');
        parts.splice(1, 0, repl.insertion);
        return path.join.apply(path, parts);
      }
    }
    throw new Error('Failed to match any path: ' + relativePath);
  });
}

function getHtmlSourcesTree() {
  // Replace $SCRIPT$ markers in HTML files.
  var htmlSrcsTree = modulesFunnel(['*/src/**/*.html']);
  htmlSrcsTree = replace(
      htmlSrcsTree,
      {files: ['*/**'], patterns: [{match: '$SCRIPTS$', replacement: replaceScriptTagInHtml}]});

  // Copy a url_params_to_form.js for each benchmark html file.
  var urlParamsToFormTree = new MultiCopy(<any>'', {
    srcPath: 'tools/build/snippets/url_params_to_form.js',
    targetPatterns: ['modules/benchmarks*/src/*', 'modules/benchmarks*/src/*/*'],
  });
  urlParamsToFormTree = stew.rename(urlParamsToFormTree, stripModulePrefix);
  return mergeTrees([htmlSrcsTree, urlParamsToFormTree]);
}

function getExamplesJsonTree() {
  // Copy JSON files
  return modulesFunnel(['playground/**/*.json']);
}


function getTemplatedPubspecsTree() {
  // The JSON structure for templating pubspec.yaml files.
  var BASE_PACKAGE_JSON = require('../../../../package.json');
  var COMMON_PACKAGE_JSON = {
    version: BASE_PACKAGE_JSON.version,
    homepage: BASE_PACKAGE_JSON.homepage,
    bugs: BASE_PACKAGE_JSON.bugs,
    license: BASE_PACKAGE_JSON.license,
    contributors: BASE_PACKAGE_JSON.contributors,
    dependencies: BASE_PACKAGE_JSON.dependencies,
    devDependencies: {}
  };
  // Generate pubspec.yaml from templates.
  var pubspecs = modulesFunnel(['**/pubspec.yaml']);
  // Then render the templates.
  return renderLodashTemplate(pubspecs, {context: {'packageJson': COMMON_PACKAGE_JSON}});
}

function getDocsTree() {
  // LICENSE files
  var licenses = new MultiCopy(<any>'', {
    srcPath: 'LICENSE',
    targetPatterns: ['modules/*'],
    exclude: [
      '*/@angular',
      '*/angular2',
      '*/angular1_router',
      '*/angular2/src/http',
      '*/payload_tests',
      '*/upgrade',
    ]  // Not in dart.
  });
  licenses = stew.rename(licenses, stripModulePrefix);

  // Documentation.
  // Rename *.dart.md -> *.dart.
  var mdTree = stew.rename(
      modulesFunnel(['**/*.dart.md']),
      (relativePath: string) => relativePath.replace(/\.dart\.md$/, '.md'));
  // Copy all assets, ignore .js. and .dart. (handled above).
  var docs = modulesFunnel(
      ['**/*.md', '**/*.png', '**/*.html', '**/*.css', '**/*.scss'],
      ['**/*.js.md', '**/*.dart.md', 'angular1_router/**/*']);

  var assets = modulesFunnel(['playground/**/*.json']);

  return mergeTrees([licenses, mdTree, docs, assets]);
}

module.exports = function makeDartTree(options: AngularBuilderOptions) {
  var dartSources = dartfmt(getSourceTree(options), {dartSDK: options.dartSDK, logs: options.logs});
  var sourceTree = mergeTrees([dartSources, getHtmlSourcesTree(), getExamplesJsonTree()]);
  sourceTree = fixDartFolderLayout(sourceTree);

  var dartTree = mergeTrees([sourceTree, getTemplatedPubspecsTree(), getDocsTree()]);

  return destCopy(dartTree, options.outputPath);
};
