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
 * @providesModule ReactComponent
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactDOMIDOperations = require('ReactDOMIDOperations');
var ReactMount = require('ReactMount');
var ReactOwner = require('ReactOwner');
var ReactReconcileTransaction = require('ReactReconcileTransaction');

var invariant = require('invariant');
var keyMirror = require('keyMirror');
var merge = require('merge');

/**
 * Prop key that references a component's owner.
 * @private
 */
var OWNER = '{owner}';

/**
 * Every React component is in one of these life cycles.
 */
var ComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTED: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTED: null
});

/**
 * Warn if there's no key explicitly set on dynamic arrays of children.
 * This allows us to keep track of children between updates.
 */

var CHILD_HAS_NO_IDENTITY =
    'You are passing a dynamic array of children. You should set the ' +
    'property "key" to a string that uniquely identifies each child.';

var HAS_WARNED = false;

/**
 * Helpers for flattening child arguments onto a new array or use an existing
 * one.
 */

function isEmptyChild(child) {
  return child == null || typeof child === 'boolean';
}

function assignKey(setKey, child, index) {
  if (ReactComponent.isValidComponent(child)) {
    var key = child.props.key;
    if (__DEV__) {
      if (!HAS_WARNED && !key) {
        HAS_WARNED = true;
        console && console.warn && console.warn(CHILD_HAS_NO_IDENTITY);
      }
    }
    child._key = (setKey ? setKey + ':' : '') + (key || ('' + index));
  }
}

function tryToReuseArray(children) {
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (isEmptyChild(child)) return false;
    assignKey('', child, i);
  }
  return true;
}

function appendNestedChildren(parentKey, sourceArray, targetArray) {
  for (var i = 0; i < sourceArray.length; i++) {
    var child = sourceArray[i];
    if (isEmptyChild(child)) continue;
    assignKey(parentKey, child, i);
    // TODO: Invalid components like strings could possibly need
    // keys assigned to them here. Usually they're not stateful but
    // CSS transitions and special events could make them stateful.
    targetArray.push(child);
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
 *   `receiveProps`
 *     Updates the rendered DOM nodes given a new set of props.
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
   * @param {?object} object
   * @return {boolean} True if `object` is a valid component.
   * @final
   */
  isValidComponent: function(object) {
    return !!(
      object &&
      typeof object.mountComponentIntoNode === 'function' &&
      typeof object.receiveProps === 'function'
    );
  },

  /**
   * @internal
   */
  LifeCycle: ComponentLifeCycle,

  /**
   * React references `ReactDOMIDOperations` using this property in order to
   * allow dependency injection.
   *
   * @internal
   */
  DOMIDOperations: ReactDOMIDOperations,

  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction: ReactReconcileTransaction,

  /**
   * @param {object} DOMIDOperations
   * @final
   */
  setDOMOperations: function(DOMIDOperations) {
    ReactComponent.DOMIDOperations = DOMIDOperations;
  },

  /**
   * @param {Transaction} ReactReconcileTransaction
   * @final
   */
  setReactReconcileTransaction: function(ReactReconcileTransaction) {
    ReactComponent.ReactReconcileTransaction = ReactReconcileTransaction;
  },

  /**
   * Base functionality for every ReactComponent constructor.
   *
   * @lends {ReactComponent.prototype}
   */
  Mixin: {

    /**
     * Returns the DOM node rendered by this component.
     *
     * @return {?DOMElement} The root node of this component.
     * @final
     * @protected
     */
    getDOMNode: function() {
      invariant(
        ExecutionEnvironment.canUseDOM,
        'getDOMNode(): The DOM is not supported in the current environment.'
      );
      invariant(
        this._lifeCycleState === ComponentLifeCycle.MOUNTED,
        'getDOMNode(): A component must be mounted to have a DOM node.'
      );
      var rootNode = this._rootNode;
      if (!rootNode) {
        rootNode = document.getElementById(this._rootNodeID);
        if (!rootNode) {
          // TODO: Log the frequency that we reach this path.
          rootNode = ReactMount.findReactRenderedDOMNodeSlow(this._rootNodeID);
        }
        this._rootNode = rootNode;
      }
      return rootNode;
    },

    /**
     * Sets a subset of the props.
     *
     * @param {object} partialProps Subset of the next props.
     * @final
     * @public
     */
    setProps: function(partialProps) {
      this.replaceProps(merge(this.props, partialProps));
    },

    /**
     * Replaces all of the props.
     *
     * @param {object} props New props.
     * @final
     * @public
     */
    replaceProps: function(props) {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(this.receiveProps, this, props, transaction);
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * Base constructor for all React component.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.construct.call(this, ...)`.
     *
     * @param {?object} initialProps
     * @param {*} children
     * @internal
     */
    construct: function(initialProps, children) {
      this.props = initialProps || {};
      // Record the component responsible for creating this component.
      this.props[OWNER] = ReactCurrentOwner.current;
      // All components start unmounted.
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;

      // Children can be either an array or more than one argument
      if (arguments.length < 2) {
        return;
      }

      if (arguments.length === 2) {

        // A single string or number child is treated as content, not an array.
        var type = typeof children;
        if (children == null || type === 'string' || type === 'number') {
          this.props.children = children;
          return;
        }

        // A single array can be reused if it's already flat
        if (Array.isArray(children) && tryToReuseArray(children)) {
          this.props.children = children;
          return;
        }

      }

      // Subsequent arguments are rolled into one child array. Array arguments
      // are flattened onto it. This is inlined to avoid extra heap allocation.
      var targetArray = null;
      for (var i = 1; i < arguments.length; i++) {
        var child = arguments[i];
        if (Array.isArray(child)) {
          if (child.length === 0) continue;

          if (targetArray === null) targetArray = [];
          appendNestedChildren(i - 1, child, targetArray);

        } else if (!isEmptyChild(child)) {

          if (ReactComponent.isValidComponent(child)) {
            // This is a static node and therefore safe to key by index.
            // No warning necessary.
            child._key = child.props.key || ('' + (i - 1));
          }

          if (targetArray === null) targetArray = [];
          targetArray.push(child);

        }
      }
      this.props.children = targetArray;
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
     * @param {ReactReconcileTransaction} transaction
     * @return {?string} Rendered markup to be inserted into the DOM.
     * @internal
     */
    mountComponent: function(rootID, transaction) {
      invariant(
        this._lifeCycleState === ComponentLifeCycle.UNMOUNTED,
        'mountComponent(%s, ...): Can only mount an unmounted component.',
        rootID
      );
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.addComponentAsRefTo(this, props.ref, props[OWNER]);
      }
      this._rootNodeID = rootID;
      this._lifeCycleState = ComponentLifeCycle.MOUNTED;
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
      invariant(
        this._lifeCycleState === ComponentLifeCycle.MOUNTED,
        'unmountComponent(): Can only unmount a mounted component.'
      );
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.removeComponentAsRefFrom(this, props.ref, props[OWNER]);
      }
      this._rootNode = null;
      this._rootNodeID = null;
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
    },

    /**
     * Updates the rendered DOM nodes given a new set of props.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.receiveProps.call(this, ...)`.
     *
     * @param {object} nextProps Next set of properties.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    receiveProps: function(nextProps, transaction) {
      invariant(
        this._lifeCycleState === ComponentLifeCycle.MOUNTED,
        'receiveProps(...): Can only update a mounted component.'
      );
      var props = this.props;
      // If either the owner or a `ref` has changed, make sure the newest owner
      // has stored a reference to `this`, and the previous owner (if different)
      // has forgotten the reference to `this`.
      if (nextProps[OWNER] !== props[OWNER] || nextProps.ref !== props.ref) {
        if (props.ref != null) {
          ReactOwner.removeComponentAsRefFrom(this, props.ref, props[OWNER]);
        }
        // Correct, even if the owner is the same, and only the ref has changed.
        if (nextProps.ref != null) {
          ReactOwner.addComponentAsRefTo(this, nextProps.ref, nextProps[OWNER]);
        }
      }
    },

    /**
     * Mounts this component and inserts it into the DOM.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @final
     * @internal
     * @see {ReactMount.renderComponent}
     */
    mountComponentIntoNode: function(rootID, container) {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(
        this._mountComponentIntoNode,
        this,
        rootID,
        container,
        transaction
      );
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @private
     */
    _mountComponentIntoNode: function(rootID, container, transaction) {
      var renderStart = Date.now();
      var markup = this.mountComponent(rootID, transaction);
      ReactMount.totalInstantiationTime += (Date.now() - renderStart);

      var injectionStart = Date.now();
      // Asynchronously inject markup by ensuring that the container is not in
      // the document when settings its `innerHTML`.
      var parent = container.parentNode;
      if (parent) {
        var next = container.nextSibling;
        parent.removeChild(container);
        container.innerHTML = markup;
        if (next) {
          parent.insertBefore(container, next);
        } else {
          parent.appendChild(container);
        }
      } else {
        container.innerHTML = markup;
      }
      ReactMount.totalInjectionTime += (Date.now() - injectionStart);
    },

    /**
     * Unmounts this component and removes it from the DOM.
     *
     * @param {DOMElement} container DOM element to unmount from.
     * @final
     * @internal
     * @see {ReactMount.unmountAndReleaseReactRootNode}
     */
    unmountComponentFromNode: function(container) {
      this.unmountComponent();
      // http://jsperf.com/emptying-a-node
      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }
    },

    /**
     * Checks if this component is owned by the supplied `owner` component.
     *
     * @param {ReactComponent} owner Component to check.
     * @return {boolean} True if `owners` owns this component.
     * @final
     * @internal
     */
    isOwnedBy: function(owner) {
      return this.props[OWNER] === owner;
    }

  }

};

function logDeprecated(msg) {
  if (__DEV__) {
    throw new Error(msg);
  } else {
    console && console.warn && console.warn(msg);
  }
}

/**
 * @deprecated
 */
ReactComponent.Mixin.update = function(props) {
  logDeprecated('this.update() is deprecated. Use this.setProps()');
  this.setProps(props);
};
ReactComponent.Mixin.updateAll = function(props) {
  logDeprecated('this.updateAll() is deprecated. Use this.replaceProps()');
  this.replaceProps(props);
};

module.exports = ReactComponent;
