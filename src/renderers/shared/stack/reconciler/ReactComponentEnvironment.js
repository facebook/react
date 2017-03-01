/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponentEnvironment
 * @flow
 */

'use strict';

var invariant = require('fbjs/lib/invariant');

type ReplaceNodeWithMarkup = (node: HTMLElement, markup: string) => void;
type ProcessChildrenUpdates = (instance: mixed, updates: mixed) => void;

type Environment = {
  replaceNodeWithMarkup: ReplaceNodeWithMarkup,
  processChildrenUpdates: ProcessChildrenUpdates,
};

var injected = false;

var ReactComponentEnvironment = {

  /**
   * Optionally injectable hook for swapping out mount images in the middle of
   * the tree.
   */
  replaceNodeWithMarkup: (null: ?ReplaceNodeWithMarkup),

  /**
   * Optionally injectable hook for processing a queue of child updates. Will
   * later move into MultiChildComponents.
   */
  processChildrenUpdates: (null: ?ReplaceNodeWithMarkup),

  injection: {
    injectEnvironment: function(environment: Environment) {
      invariant(
        !injected,
        'ReactCompositeComponent: injectEnvironment() can only be called once.'
      );
      ReactComponentEnvironment.replaceNodeWithMarkup =
        environment.replaceNodeWithMarkup;
      ReactComponentEnvironment.processChildrenUpdates =
        environment.processChildrenUpdates;
      injected = true;
    },
  },

};

module.exports = ReactComponentEnvironment;
