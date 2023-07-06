// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Source loader.
 */

const fs = require('fs');
const fsPath = require('path');

const { EOL } = require('os');

const babelGenerator = require('@babel/generator').default;
const babelTraverse = require('@babel/traverse').default;
const babelTypes = require('@babel/types');
const babylon = require('@babel/parser');

const exceptions = require('./exceptions.js');

const SCRIPT = Symbol('SCRIPT');
const MODULE = Symbol('MODULE');

const V8_BUILTIN_PREFIX = '__V8Builtin';
const V8_REPLACE_BUILTIN_REGEXP = new RegExp(
    V8_BUILTIN_PREFIX + '(\\w+)\\(', 'g');

const BABYLON_OPTIONS = {
    sourceType: 'script',
    allowReturnOutsideFunction: true,
    tokens: false,
    ranges: false,
    plugins: [
        'asyncGenerators',
        'bigInt',
        'classPrivateMethods',
        'classPrivateProperties',
        'classProperties',
        'doExpressions',
        'exportDefaultFrom',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
    ],
}

const BABYLON_REPLACE_VAR_OPTIONS = Object.assign({}, BABYLON_OPTIONS);
BABYLON_REPLACE_VAR_OPTIONS['placeholderPattern'] = /^VAR_[0-9]+$/;

function _isV8OrSpiderMonkeyLoad(path) {
  // 'load' and 'loadRelativeToScript' used by V8 and SpiderMonkey.
  return (babelTypes.isIdentifier(path.node.callee) &&
          (path.node.callee.name == 'load' ||
           path.node.callee.name == 'loadRelativeToScript') &&
          path.node.arguments.length == 1 &&
          babelTypes.isStringLiteral(path.node.arguments[0]));
}

function _isChakraLoad(path) {
  // 'WScript.LoadScriptFile' used by Chakra.
  // TODO(ochang): The optional second argument can change semantics ("self",
  // "samethread", "crossthread" etc).
  // Investigate whether if it still makes sense to include them.
  return (babelTypes.isMemberExpression(path.node.callee) &&
          babelTypes.isIdentifier(path.node.callee.property) &&
          path.node.callee.property.name == 'LoadScriptFile' &&
          path.node.arguments.length >= 1 &&
          babelTypes.isStringLiteral(path.node.arguments[0]));
}

function _findPath(path, caseSensitive=true) {
  // If the path exists, return the path. Otherwise return null. Used to handle
  // case insensitive matches for Chakra tests.
  if (caseSensitive) {
    return fs.existsSync(path) ? path : null;
  }

  path = fsPath.normalize(fsPath.resolve(path));
  const pathComponents = path.split(fsPath.sep);
  let realPath = fsPath.resolve(fsPath.sep);

  for (let i = 1; i < pathComponents.length; i++) {
    // For each path component, do a directory listing to see if there is a case
    // insensitive match.
    const curListing = fs.readdirSync(realPath);
    let realComponent = null;
    for (const component of curListing) {
      if (i < pathComponents.length - 1 &&
          !fs.statSync(fsPath.join(realPath, component)).isDirectory()) {
        continue;
      }

      if (component.toLowerCase() == pathComponents[i].toLowerCase()) {
        realComponent = component;
        break;
      }
    }

    if (!realComponent) {
      return null;
    }

    realPath = fsPath.join(realPath, realComponent);
  }

  return realPath;
}

function _findDependentCodePath(filePath, baseDirectory, caseSensitive=true) {
  const fullPath = fsPath.join(baseDirectory, filePath);

  const realPath = _findPath(fullPath, caseSensitive)
  if (realPath) {
    // Check base directory of current file.
    return realPath;
  }

  while (fsPath.dirname(baseDirectory) != baseDirectory) {
    // Walk up the directory tree.
    const testPath = fsPath.join(baseDirectory, filePath);
    const realPath = _findPath(testPath, caseSensitive)
    if (realPath) {
      return realPath;
    }

    baseDirectory = fsPath.dirname(baseDirectory);
  }

  return null;
}

/**
 * Removes V8/Spidermonkey/Chakra load expressions in a source AST and returns
 * their string values in an array.
 *
 * @param {string} originalFilePath Absolute path to file.
 * @param {AST} ast Babel AST of the sources.
 */
function resolveLoads(originalFilePath, ast) {
  const dependencies = [];

  babelTraverse(ast, {
    CallExpression(path) {
      const isV8OrSpiderMonkeyLoad = _isV8OrSpiderMonkeyLoad(path);
      const isChakraLoad = _isChakraLoad(path);
      if (!isV8OrSpiderMonkeyLoad && !isChakraLoad) {
        return;
      }

      let loadValue = path.node.arguments[0].extra.rawValue;
      // Normalize Windows path separators.
      loadValue = loadValue.replace(/\\/g, fsPath.sep);

      // Remove load call.
      path.remove();

      const resolvedPath = _findDependentCodePath(
          loadValue, fsPath.dirname(originalFilePath), !isChakraLoad);
      if (!resolvedPath) {
        console.log('ERROR: Could not find dependent path for', loadValue);
        return;
      }

      if (exceptions.isTestSkippedAbs(resolvedPath)) {
        // Dependency is skipped.
        return;
      }

      // Add the dependency path.
      dependencies.push(resolvedPath);
    }
  });
  return dependencies;
}

function isStrictDirective(directive) {
  return (directive.value &&
          babelTypes.isDirectiveLiteral(directive.value) &&
          directive.value.value === 'use strict');
}

function replaceV8Builtins(code) {
  return code.replace(/%(\w+)\(/g, V8_BUILTIN_PREFIX + '$1(');
}

function restoreV8Builtins(code) {
  return code.replace(V8_REPLACE_BUILTIN_REGEXP, '%$1(');
}

function maybeUseStict(code, useStrict) {
  if (useStrict) {
    return `'use strict';${EOL}${EOL}${code}`;
  }
  return code;
}

class Source {
  constructor(baseDir, relPath, flags, dependentPaths) {
    this.baseDir = baseDir;
    this.relPath = relPath;
    this.flags = flags;
    this.dependentPaths = dependentPaths;
    this.sloppy = exceptions.isTestSloppyRel(relPath);
  }

  get absPath() {
    return fsPath.join(this.baseDir, this.relPath);
  }

  /**
   * Specifies if the source isn't compatible with strict mode.
   */
  isSloppy() {
    return this.sloppy;
  }

  /**
   * Specifies if the source has a top-level 'use strict' directive.
   */
  isStrict() {
    throw Error('Not implemented');
  }

  /**
   * Generates the code as a string without any top-level 'use strict'
   * directives. V8 natives that were replaced before parsing are restored.
   */
  generateNoStrict() {
    throw Error('Not implemented');
  }

  /**
   * Recursively adds dependencies of a this source file.
   *
   * @param {Map} dependencies Dependency map to which to add new, parsed
   *     dependencies unless they are already in the map.
   * @param {Map} visitedDependencies A set for avoiding loops.
   */
  loadDependencies(dependencies, visitedDependencies) {
    visitedDependencies = visitedDependencies || new Set();

    for (const absPath of this.dependentPaths) {
      if (dependencies.has(absPath) ||
          visitedDependencies.has(absPath)) {
        // Already added.
        continue;
      }

      // Prevent infinite loops.
      visitedDependencies.add(absPath);

      // Recursively load dependencies.
      const dependency = loadDependencyAbs(this.baseDir, absPath);
      dependency.loadDependencies(dependencies, visitedDependencies);

      // Add the dependency.
      dependencies.set(absPath, dependency);
    }
  }
}

/**
 * Represents sources whose AST can be manipulated.
 */
class ParsedSource extends Source {
  constructor(ast, baseDir, relPath, flags, dependentPaths) {
    super(baseDir, relPath, flags, dependentPaths);
    this.ast = ast;
  }

  isStrict() {
    return !!this.ast.program.directives.filter(isStrictDirective).length;
  }

  generateNoStrict() {
    const allDirectives = this.ast.program.directives;
    this.ast.program.directives = this.ast.program.directives.filter(
        directive => !isStrictDirective(directive));
    try {
      const code = babelGenerator(this.ast.program, {comments: true}).code;
      return restoreV8Builtins(code);
    } finally {
      this.ast.program.directives = allDirectives;
    }
  }
}

/**
 * Represents sources with cached code.
 */
class CachedSource extends Source {
  constructor(source) {
    super(source.baseDir, source.relPath, source.flags, source.dependentPaths);
    this.use_strict = source.isStrict();
    this.code = source.generateNoStrict();
  }

  isStrict() {
    return this.use_strict;
  }

  generateNoStrict() {
    return this.code;
  }
}

/**
 * Read file path into an AST.
 *
 * Post-processes the AST by replacing V8 natives and removing disallowed
 * natives, as well as removing load expressions and adding the paths-to-load
 * as meta data.
 */
function loadSource(baseDir, relPath, parseStrict=false) {
  const absPath = fsPath.resolve(fsPath.join(baseDir, relPath));
  const data = fs.readFileSync(absPath, 'utf-8');

  if (guessType(data) !== SCRIPT) {
    return null;
  }

  const preprocessed = maybeUseStict(replaceV8Builtins(data), parseStrict);
  const ast = babylon.parse(preprocessed, BABYLON_OPTIONS);

  removeComments(ast);
  cleanAsserts(ast);
  annotateWithOriginalPath(ast, relPath);

  const flags = loadFlags(data);
  const dependentPaths = resolveLoads(absPath, ast);

  return new ParsedSource(ast, baseDir, relPath, flags, dependentPaths);
}

function guessType(data) {
  if (data.includes('// MODULE')) {
    return MODULE;
  }

  return SCRIPT;
}

/**
 * Remove existing comments.
 */
function removeComments(ast) {
  babelTraverse(ast, {
    enter(path) {
      babelTypes.removeComments(path.node);
    }
  });
}

/**
 * Removes "Assert" from strings in spidermonkey shells or from older
 * crash tests: https://crbug.com/1068268
 */
function cleanAsserts(ast) {
  function replace(string) {
    return string == null ? null : string.replace(/[Aa]ssert/g, '*****t');
  }
  babelTraverse(ast, {
    StringLiteral(path) {
      path.node.value = replace(path.node.value);
      path.node.extra.raw = replace(path.node.extra.raw);
      path.node.extra.rawValue = replace(path.node.extra.rawValue);
    },
    TemplateElement(path) {
      path.node.value.cooked = replace(path.node.value.cooked);
      path.node.value.raw = replace(path.node.value.raw);
    },
  });
}

/**
 * Annotate code with top-level comment.
 */
function annotateWithComment(ast, comment) {
  if (ast.program && ast.program.body && ast.program.body.length > 0) {
    babelTypes.addComment(
        ast.program.body[0], 'leading', comment, true);
  }
}

/**
 * Annotate code with original file path.
 */
function annotateWithOriginalPath(ast, relPath) {
  annotateWithComment(ast, ' Original: ' + relPath);
}

// TODO(machenbach): Move this into the V8 corpus. Other test suites don't
// use this flag logic.
function loadFlags(data) {
  const result = [];
  let count = 0;
  for (const line of data.split('\n')) {
    if (count++ > 40) {
      // No need to process the whole file. Flags are always added after the
      // copyright header.
      break;
    }
    const match = line.match(/\/\/ Flags:\s*(.*)\s*/);
    if (!match) {
      continue;
    }
    for (const flag of exceptions.filterFlags(match[1].split(/\s+/))) {
      result.push(flag);
    }
  }
  return result;
}

// Convenience helper to load sources with absolute paths.
function loadSourceAbs(baseDir, absPath) {
  return loadSource(baseDir, fsPath.relative(baseDir, absPath));
}

const dependencyCache = new Map();

function loadDependency(baseDir, relPath) {
  const absPath = fsPath.join(baseDir, relPath);
  let dependency = dependencyCache.get(absPath);
  if (!dependency) {
    const source = loadSource(baseDir, relPath);
    dependency = new CachedSource(source);
    dependencyCache.set(absPath, dependency);
  }
  return dependency;
}

function loadDependencyAbs(baseDir, absPath) {
  return loadDependency(baseDir, fsPath.relative(baseDir, absPath));
}

// Convenience helper to load a file from the resources directory.
function loadResource(fileName) {
  return loadDependency(__dirname, fsPath.join('resources', fileName));
}

function generateCode(source, dependencies=[]) {
  const allSources = dependencies.concat([source]);
  const codePieces = allSources.map(
      source => source.generateNoStrict());

  if (allSources.some(source => source.isStrict()) &&
      !allSources.some(source => source.isSloppy())) {
    codePieces.unshift('\'use strict\';');
  }

  return codePieces.join(EOL + EOL);
}

module.exports = {
  BABYLON_OPTIONS: BABYLON_OPTIONS,
  BABYLON_REPLACE_VAR_OPTIONS: BABYLON_REPLACE_VAR_OPTIONS,
  annotateWithComment: annotateWithComment,
  generateCode: generateCode,
  loadDependencyAbs: loadDependencyAbs,
  loadResource: loadResource,
  loadSource: loadSource,
  loadSourceAbs: loadSourceAbs,
  ParsedSource: ParsedSource,
}
