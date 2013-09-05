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
 * @providesModule ReactComponentBrowserEnvironment
 */

/*jslint evil: true */

"use strict";

var ReactDOMIDOperations = require('ReactDOMIDOperations');
var ReactMarkupChecksum = require('ReactMarkupChecksum');
var ReactMount = require('ReactMount');
var ReactReconcileTransaction = require('ReactReconcileTransaction');

var getReactRootElementInContainer = require('getReactRootElementInContainer');
var invariant = require('invariant');
var mutateHTMLNodeWithMarkup = require('mutateHTMLNodeWithMarkup');


var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;


/**
 * Abstracts away all functionality of `ReactComponent` requires knowledge of
 * the browser context.
 */
var ReactComponentBrowserEnvironment = {
  /**
   * Mixed into every component instance.
   */
  Mixin: {
    /**
     * Returns the DOM node rendered by this component.
     *
     * @return {DOMElement} The root node of this component.
     * @final
     * @protected
     */
    getDOMNode: function() {
      invariant(
        this.isMounted(),
        'getDOMNode(): A component must be mounted to have a DOM node.'
      );
      return ReactMount.getNode(this._rootNodeID);
    }
  },

  ReactReconcileTransaction: ReactReconcileTransaction,

  DOMIDOperations: ReactDOMIDOperations,

  /**
   * If a particular environment requires that some resources be cleaned up,
   * specify this in the injected Mixin. In the DOM, we would likely want to
   * purge any cached node ID lookups.
   *
   * @private
   */
  unmountIDFromEnvironment: function(rootNodeID) {
    ReactMount.purgeID(rootNodeID);
  },

  /**
   * @param {string} markup Markup string to place into the DOM Element.
   * @param {DOMElement} container DOM Element to insert markup into.
   * @param {boolean} shouldReuseMarkup Should reuse the existing markup in the
   * container if possible.
   */
  mountImageIntoNode: function(markup, container, shouldReuseMarkup) {
    invariant(
      container && (
        container.nodeType === ELEMENT_NODE_TYPE ||
        container.nodeType === DOC_NODE_TYPE && ReactMount.allowFullPageRender
      ),
      'mountComponentIntoNode(...): Target container is not valid.'
    );
    if (shouldReuseMarkup) {
      if (ReactMarkupChecksum.canReuseMarkup(
            markup,
            getReactRootElementInContainer(container))) {
        return;
      } else {
        if (__DEV__) {
          console.warn(
            'React attempted to use reuse markup in a container but the ' +
            'checksum was invalid. This generally means that you are using ' +
            'server rendering and the markup generated on the server was ' +
            'not what the client was expecting. React injected new markup ' +
            'to compensate which works but you have lost many of the ' +
            'benefits of server rendering. Instead, figure out why the ' +
            'markup being generated is different on the client or server.'
          );
        }
      }
    }

    // You can't naively set the innerHTML of the entire document. You need
    // to mutate documentElement which requires doing some crazy tricks. See
    // mutateHTMLNodeWithMarkup()
    if (container.nodeType === DOC_NODE_TYPE) {
      mutateHTMLNodeWithMarkup(container.documentElement, markup);
      return;
    }

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
  }
};

module.exports = ReactComponentBrowserEnvironment;
