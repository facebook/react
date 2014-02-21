/**
 * Copyright 2013-2014 Facebook, Inc.
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
 *
 * @providesModule ReactMultiChildUpdateQueue
 */

"use strict";

var PooledClass = require('PooledClass');
var ReactComponent = require('ReactComponent');
var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');

var mixInto = require('mixInto');

function ReactMultiChildUpdateQueue() {
  /**
   * Queue of update configuration objects.
   *
   * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
   *
   * @type {array<object>}
   * @private
   */
  this.updateQueue = [];

  /**
   * Queue of markup to be rendered.
   *
   * @type {array<string>}
   * @private
   */
  this.markupQueue = [];
}

mixInto(ReactMultiChildUpdateQueue, {
  /**
   * Enqueues markup to be rendered and inserted at a supplied index.
   *
   * @param {string} parentID ID of the parent component.
   * @param {string} markup Markup that renders into an element.
   * @param {number} toIndex Destination index.
   * @private
   */
  enqueueMarkup: function(parentID, markup, toIndex) {
    // NOTE: Null values reduce hidden classes.
    this.updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
      markupIndex: this.markupQueue.push(markup) - 1,
      textContent: null,
      fromIndex: null,
      toIndex: toIndex
    });
  },

  /**
   * Enqueues moving an existing element to another index.
   *
   * @param {string} parentID ID of the parent component.
   * @param {number} fromIndex Source index of the existing element.
   * @param {number} toIndex Destination index of the element.
   * @private
   */
  enqueueMove: function(parentID, fromIndex, toIndex) {
    // NOTE: Null values reduce hidden classes.
    this.updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
      markupIndex: null,
      textContent: null,
      fromIndex: fromIndex,
      toIndex: toIndex
    });
  },

  /**
   * Enqueues removing an element at an index.
   *
   * @param {string} parentID ID of the parent component.
   * @param {number} fromIndex Index of the element to remove.
   * @private
   */
  enqueueRemove: function(parentID, fromIndex) {
    // NOTE: Null values reduce hidden classes.
    this.updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.REMOVE_NODE,
      markupIndex: null,
      textContent: null,
      fromIndex: fromIndex,
      toIndex: null
    });
  },

  /**
   * Enqueues setting the text content.
   *
   * @param {string} parentID ID of the parent component.
   * @param {string} textContent Text content to set.
   * @private
   */
  enqueueTextContent: function(parentID, textContent) {
    // NOTE: Null values reduce hidden classes.
    this.updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
      markupIndex: null,
      textContent: textContent,
      fromIndex: null,
      toIndex: null
    });
  },

  /**
   * Processes any enqueued updates.
   *
   * @private
   */
  processUpdates: function() {
    if (this.updateQueue.length) {
      ReactComponent.BackendIDOperations.dangerouslyProcessChildrenUpdates(
        this.updateQueue,
        this.markupQueue
      );
      this.reset();
    }
  },

  reset: function() {
    this.updateQueue.length = 0;
    this.markupQueue.length = 0;
  },

  destructor: function() {
    this.reset();
  }
});

PooledClass.addPoolingTo(ReactMultiChildUpdateQueue);

module.exports = ReactMultiChildUpdateQueue;
