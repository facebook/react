/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global exports:true*/
/*jslint node: true*/
"use strict";

/**
 * Syntax transfomer for javascript. Takes the source in, spits the source
 * out. Tries to maintain readability and preserve whitespace and line numbers
 * where posssible.
 *
 * Support
 * - ES6 class transformation + private property munging, see ./classes.js
 * - React XHP style syntax transformations, see ./react.js
 * - Bolt XHP style syntax transformations, see ./bolt.js
 *
 * The general flow is the following:
 * - Parse the source with our customized esprima-parser
 *   https://github.com/voloko/esprima. We have to customize the parser to
 *   support non-standard XHP-style syntax. We parse the source range: true
 *   option that forces esprima to return positions in the source within
 *   resulting parse tree.
 *
 * - Traverse resulting syntax tree, trying to apply a set of visitors to each
 *   node. Each visitor should provide a .test() function that tests if the
 *   visitor can process a given node.
 *
 * - Visitor is responsible for code generation for a given syntax node.
 *   Generated code is stored in state.g.buffer that is passed to every
 *   visitor. It's up to the visitor to process the code the way it sees fit.
 *   All of the current visitors however use both the node and the original
 *   source to generate transformed code. They use nodes to generate new
 *   code and they copy the original source, preserving whitespace and comments,
 *   for the parts they don't care about.
 */
var esprima = require('esprima');

var createState = require('./utils').createState;
var catchup = require('./utils').catchup;

/**
 * @param {object} object
 * @param {function} visitor
 * @param {array} path
 * @param {object} state
 */
function traverse(object, path, state) {
  var key, child;

  if (walker(traverse, object, path, state) === false) {
    return;
  }
  path.unshift(object);
  for (key in object) {
    // skip obviously wrong attributes
    if (key === 'range' || key === 'loc') {
      continue;
    }
    if (object.hasOwnProperty(key)) {
      child = object[key];
      if (typeof child === 'object' && child !== null) {
        child.range && catchup(child.range[0], state);
        traverse(child, path, state);
        child.range && catchup(child.range[1], state);
      }
    }
  }
  path.shift();
}

function walker(traverse, object, path, state) {
  var visitors = state.g.visitors;
  for (var i = 0; i < visitors.length; i++) {
    if (visitors[i].test(object, path, state)) {
      return visitors[i](traverse, object, path, state);
    }
  }
}

function runPass(source, visitors, options) {
  var ast;
  try {
    ast = esprima.parse(source, { comment: true, loc: true, range: true });
  } catch (e) {
    e.message = 'Parse Error: ' + e.message;
    throw e;
  }
  var state = createState(source, options);
  state.g.originalProgramAST = ast;
  state.g.visitors = visitors;

  if (options.sourceMap) {
    var SourceMapGenerator = require('source-map').SourceMapGenerator;
    state.g.sourceMap = new SourceMapGenerator({ file: 'transformed.js' });
  }
  traverse(ast, [], state);
  catchup(source.length, state);
  return state;
}

/**
 * Applies all available transformations to the source
 * @param {array} visitors
 * @param {string} source
 * @param {?object} options
 * @return {object}
 */
function transform(visitors, source, options) {
  options = options || {};

  var state = runPass(source, visitors, options);
  var sourceMap = state.g.sourceMap;

  if (sourceMap) {
    return {
      sourceMap: sourceMap,
      sourceMapFilename: options.filename || 'source.js',
      code: state.g.buffer
    };
  } else {
    return {
      code: state.g.buffer
    };
  }
}


exports.transform = transform;
