/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactComponent
 */

"use strict";

var ReactOwner = require('ReactOwner');
var ReactRef = require('ReactRef');

var invariant = require('invariant');

function attachRef(ref, component, owner) {
  if (ref instanceof ReactRef) {
    ReactRef.attachRef(ref, component);
  } else {
    ReactOwner.addComponentAsRefTo(component, ref, owner);
  }
}

function detachRef(ref, component, owner) {
  if (ref instanceof ReactRef) {
    ReactRef.detachRef(ref, component);
  } else {
    ReactOwner.removeComponentAsRefFrom(component, ref, owner);
  }
}

/**
 * Components are the basic units of composition in React.
 *
 * Every component accepts a set of keyed input parameters known as "props" that
 * are initialized by the constructor. Once a component is mounted, the props
 * can be mutated using `setProps` or `replaceProps`.
 *
 * Every component is capable of the following operations:
 *
 *   `mountComponent`
 *     Initializes the component, renders markup, and registers event listeners.
 *
 *   `receiveComponent`
 *     Updates the rendered DOM nodes to match the given component.
 *
 *   `unmountComponent`
 *     Releases any resources allocated by this component.
 *
 * Components can also be "owned" by other components. Being owned by another
 * component means being constructed by that component. This is different from
 * being the child of a component, which means having a DOM representation that
 * is a child of the DOM representation of that component.
 *
 * @class ReactComponent
 */
var ReactComponent = {

  /**
   * Injected module that provides ability to mutate individual properties.
   * Injected into the base class because many different subclasses need access
   * to this.
   *
   * @internal
   */
  BackendIDOperations: null,

  /**
   * Base functionality for every ReactComponent constructor. Mixed into the
   * `ReactComponent` prototype, but exposed statically for easy access.
   *
   * @lends {ReactComponent.prototype}
   */
  Mixin: {

    /**
     * Base constructor for all React components.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.construct.call(this, ...)`.
     *
     * @param {ReactElement} element
     * @internal
     */
    construct: function(element) {
      // We keep the old element and a reference to the pending element
      // to track updates.
      this._currentElement = element;
      this._mountIndex = 0;
      this._mountDepth = 0;
    },

    /**
     * Initializes the component, renders markup, and registers event listeners.
     *
     * NOTE: This does not insert any nodes into the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.mountComponent.call(this, ...)`.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
     * @param {number} mountDepth number of components in the owner hierarchy.
     * @return {?string} Rendered markup to be inserted into the DOM.
     * @internal
     */
    mountComponent: function(rootID, transaction, mountDepth, context) {
      var ref = this._currentElement.ref;
      if (ref != null) {
        var owner = this._currentElement._owner;
        attachRef(ref, this, owner);
      }
      this._mountDepth = mountDepth;
      // Effectively: return '';
    },

    /**
     * Releases any resources allocated by `mountComponent`.
     *
     * NOTE: This does not remove any nodes from the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.unmountComponent.call(this)`.
     *
     * @internal
     */
    unmountComponent: function() {
      var ref = this._currentElement.ref;
      if (ref != null) {
        detachRef(ref, this, this._currentElement._owner);
      }
    },

    /**
     * Updates the component's currently mounted representation.
     *
     * @param {ReactReconcileTransaction} transaction
     * @param {object} prevElement
     * @param {object} nextElement
     * @internal
     */
    updateComponent: function(transaction, prevElement, nextElement, context) {
      // If either the owner or a `ref` has changed, make sure the newest owner
      // has stored a reference to `this`, and the previous owner (if different)
      // has forgotten the reference to `this`. We use the element instead
      // of the public this.props because the post processing cannot determine
      // a ref. The ref conceptually lives on the element.

      // TODO: Should this even be possible? The owner cannot change because
      // it's forbidden by shouldUpdateReactComponent. The ref can change
      // if you swap the keys of but not the refs. Reconsider where this check
      // is made. It probably belongs where the key checking and
      // instantiateReactComponent is done.

      if (nextElement._owner !== prevElement._owner ||
          nextElement.ref !== prevElement.ref) {
        if (prevElement.ref != null) {
          detachRef(prevElement.ref, this, prevElement._owner);
        }
        // Correct, even if the owner is the same, and only the ref has changed.
        if (nextElement.ref != null) {
          attachRef(nextElement.ref, this, nextElement._owner);
        }
      }
    },

    /**
     * Get the publicly accessible representation of this component - i.e. what
     * is exposed by refs and renderComponent. Can be null for stateless
     * components.
     *
     * @return {?ReactComponent} the actual sibling Component.
     * @internal
     */
    getPublicInstance: function() {
      invariant(
        false,
        'getPublicInstance should never be called on the base class. It must ' +
        'be overriden.'
      );
    }
  }
};

module.exports = ReactComponent;
