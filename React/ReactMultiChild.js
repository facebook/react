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
 *
 * @providesModule ReactMultiChild
 */

"use strict";

var ReactComponent = require("./ReactComponent");

/**
 * Given a `curChild` and `newChild`, determines if `curChild` should be managed
 * as it exists, as opposed to being destroyed and/or replaced.
 * @param {?ReactComponent} curChild
 * @param {?ReactComponent} newChild
 * @return {!boolean} Whether or not `curChild` should be updated with
 * `newChild`'s props
 */
function shouldManageExisting(curChild, newChild) {
  return curChild && newChild && curChild.constructor === newChild.constructor;
}

/**
 * `ReactMultiChild` provides common functionality for components that have
 * multiple children. Standard `ReactCompositeComponent`s do not currently have
 * multiple children. `ReactNativeComponent`s do, however. Other specially
 * reconciled components will also have multiple children. Contains three
 * internally used properties that are used to keep track of state throughout
 * the `updateMultiChild` process.
 *
 * @class ReactMultiChild
 */

/**
 * @lends `ReactMultiChildMixin`.
 */
var ReactMultiChildMixin = {

  enqueueMarkupAt: function(markup, insertAt) {
    this.domOperations = this.domOperations || [];
    this.domOperations.push({insertMarkup: markup, finalIndex: insertAt});
  },

  enqueueMove: function(originalIndex, finalIndex) {
    this.domOperations = this.domOperations || [];
    this.domOperations.push({moveFrom: originalIndex, finalIndex: finalIndex});
  },

  enqueueUnmountChildByName: function(name, removeChild) {
    if (ReactComponent.isValidComponent(removeChild)) {
      this.domOperations = this.domOperations || [];
      this.domOperations.push({removeAt: removeChild._domIndex});
      removeChild.unmountComponent && removeChild.unmountComponent();
      delete this._renderedChildren[name];
    }
  },

  /**
   * Process any pending DOM operations that have been accumulated when updating
   * the UI. By default, we execute the injected `DOMIDOperations` module's
   * `manageChildrenByParentID` which does executes the DOM operations without
   * any animation. It can be used as a reference implementation for special
   * animation based implementations.
   *
   * @abstract
   */
  processChildDOMOperationsQueue: function() {
    if (this.domOperations) {
      ReactComponent.DOMIDOperations
        .manageChildrenByParentID(this._rootNodeID, this.domOperations);
      this.domOperations = null;
    }
  },

  unmountMultiChild: function() {
    var renderedChildren = this._renderedChildren;
    for (var name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name) && renderedChildren[name]) {
        var renderedChild = renderedChildren[name];
        renderedChild.unmountComponent && renderedChild.unmountComponent();
      }
    }
    this._renderedChildren = null;
  },

  /**
   * Generates markup for a component that holds multiple children. #todo: Allow
   * all `ReactMultiChildMixin`s to support having arrays of children without a
   * container node. This current implementation may assume that children exist
   * at domIndices [0, parentNode.length].
   *
   * Has side effects of (likely) causing events to be registered. Also, every
   * component instance may only be rendered once.
   *
   * @param {?Object} children Flattened children object.
   * @return {!String} The rendered markup.
   */
  mountMultiChild: function(children, transaction) {
    var accum = '';
    var index = 0;
    for (var name in children) {
      var child = children[name];
      if (children.hasOwnProperty(name) && child) {
        accum += child.mountComponent(
          this._rootNodeID + '.' + name,
          transaction
        );
        child._domIndex = index;
        index++;
      }
    }
    this._renderedChildren = children; // children are in just the right form!
    this.domOperations = null;
    return accum;
  },

  /**
   * Reconciles new children with old children in three phases.
   *
   * - Adds new content while updating existing children that should remain.
   * - Remove children that are no longer present in the next children.
   * - As a very last step, moves existing dom structures around.
   * - (Comment 1) `curChildrenDOMIndex` is the largest index of the current
   *   rendered children that appears in the next children and did not need to
   *   be "moved".
   * - (Comment 2) This is the key insight. If any non-removed child's previous
   *   index is less than `curChildrenDOMIndex` it must be moved.
   *
   * @param {?Object} children Flattened children object.
   */
  updateMultiChild: function(nextChildren, transaction) {
    if (!nextChildren && !this._renderedChildren) {
      return;
    } else if (nextChildren && !this._renderedChildren) {
      this._renderedChildren = {}; // lazily allocate backing store with nothing
    } else if (!nextChildren && this._renderedChildren) {
      nextChildren = {};
    }
    var rootDomIdDot = this._rootNodeID + '.';
    var markupBuffer = null;  // Accumulate adjacent new children markup.
    var numPendingInsert = 0; // How many root nodes are waiting in markupBuffer
    var loopDomIndex = 0;     // Index of loop through new children.
    var curChildrenDOMIndex = 0;  // See (Comment 1)
    for (var name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {continue;}
      var curChild = this._renderedChildren[name];
      var nextChild = nextChildren[name];
      if (shouldManageExisting(curChild, nextChild)) {
        if (markupBuffer) {
          this.enqueueMarkupAt(markupBuffer, loopDomIndex - numPendingInsert);
          markupBuffer = null;
        }
        numPendingInsert = 0;
        if (curChild._domIndex < curChildrenDOMIndex) { // (Comment 2)
          this.enqueueMove(curChild._domIndex, loopDomIndex);
        }
        curChildrenDOMIndex = Math.max(curChild._domIndex, curChildrenDOMIndex);
        !nextChild.props.isStatic &&
          curChild.receiveProps(nextChild.props, transaction);
        curChild._domIndex = loopDomIndex;
      } else {
        if (curChild) {               // !shouldUpdate && curChild => delete
          this.enqueueUnmountChildByName(name, curChild);
          curChildrenDOMIndex =
            Math.max(curChild._domIndex, curChildrenDOMIndex);
        }
        if (nextChild) {              // !shouldUpdate && nextChild => insert
          this._renderedChildren[name] = nextChild;
          var nextMarkup =
            nextChild.mountComponent(rootDomIdDot + name, transaction);
          markupBuffer = markupBuffer ? markupBuffer + nextMarkup : nextMarkup;
          numPendingInsert++;
          nextChild._domIndex = loopDomIndex;
        }
      }
      loopDomIndex = nextChild ? loopDomIndex + 1 : loopDomIndex;
    }
    if (markupBuffer) {
      this.enqueueMarkupAt(markupBuffer, loopDomIndex - numPendingInsert);
    }
    for (var childName in this._renderedChildren) { // from other direction
      if (!this._renderedChildren.hasOwnProperty(childName)) { continue; }
      var child = this._renderedChildren[childName];
      if (child && !nextChildren[childName]) {
        this.enqueueUnmountChildByName(childName, child);
      }
    }
    this.processChildDOMOperationsQueue();
  }
};

var ReactMultiChild = {
  Mixin: ReactMultiChildMixin
};

module.exports = ReactMultiChild;
