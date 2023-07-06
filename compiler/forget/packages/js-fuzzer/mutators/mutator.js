// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Mutator
 */
'use strict';

const babelTraverse = require('@babel/traverse').default;
const babelTypes = require('@babel/types');

class Mutator {
  get visitor() {
    return null;
  }

  _traverse(ast, visitor) {
    let oldEnter = null;
    if (Object.prototype.hasOwnProperty.call(visitor, 'enter')) {
      oldEnter = visitor['enter'];
    }

    // Transparently skip nodes that are marked.
    visitor['enter'] = (path) => {
      if (this.shouldSkip(path.node)) {
        path.skip();
        return;
      }

      if (oldEnter) {
        oldEnter(path);
      }
    }

    babelTraverse(ast, visitor);
  }

  mutate(source) {
    if (Array.isArray(this.visitor)) {
      for (const visitor of this.visitor) {
        this._traverse(source.ast, visitor);
      }
    } else {
      this._traverse(source.ast, this.visitor);
    }
  }

  get _skipPropertyName() {
    return '__skip' + this.constructor.name;
  }

  shouldSkip(node) {
    return Boolean(node[this._skipPropertyName]);
  }

  skipMutations(node) {
    // Mark a node to skip further mutations of the same kind.
    if (Array.isArray(node)) {
      for (const item of node) {
        item[this._skipPropertyName] = true;
      }
    } else {
      node[this._skipPropertyName] = true;
    }

    return node;
  }

  insertBeforeSkip(path, node) {
    this.skipMutations(node);
    path.insertBefore(node);
  }

  insertAfterSkip(path, node) {
    this.skipMutations(node);
    path.insertAfter(node);
  }

  replaceWithSkip(path, node) {
    this.skipMutations(node);
    path.replaceWith(node);
  }

  replaceWithMultipleSkip(path, node) {
    this.skipMutations(node);
    path.replaceWithMultiple(node);
  }

  annotate(node, message) {
    babelTypes.addComment(
        node, 'leading', ` ${this.constructor.name}: ${message} `);
  }
}

module.exports = {
  Mutator: Mutator,
}
