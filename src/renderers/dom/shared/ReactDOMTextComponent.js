/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMTextComponent
 */

'use strict';

var DOMChildrenOperations = require('DOMChildrenOperations');
var DOMLazyTree = require('DOMLazyTree');
var DOMPropertyOperations = require('DOMPropertyOperations');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactPerf = require('ReactPerf');

var assign = require('Object.assign');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var validateDOMNesting = require('validateDOMNesting');

var getNode = ReactDOMComponentTree.getNodeFromInstance;

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings in elements so that they can undergo
 * the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactDOMTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactDOMTextComponent = function(props) {
  // This constructor and its argument is currently used by mocks.
};

assign(ReactDOMTextComponent.prototype, {

  /**
   * @param {ReactText} text
   * @internal
   */
  construct: function(text) {
    // TODO: This is really a ReactText (ReactNode), not a ReactElement
    this._currentElement = text;
    this._stringText = '' + text;
    // ReactDOMComponentTree uses these:
    this._nativeNode = null;
    this._nativeParent = null;

    // Properties
    this._domID = null;
    this._mountIndex = 0;
  },

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(
    transaction,
    nativeParent,
    nativeContainerInfo,
    context
  ) {
    if (__DEV__) {
      var parentInfo;
      if (nativeParent != null) {
        parentInfo = nativeParent._ancestorInfo;
      } else if (nativeContainerInfo != null) {
        parentInfo = nativeContainerInfo._ancestorInfo;
      }
      if (parentInfo) {
        // parentInfo should always be present except for the top-level
        // component when server rendering
        validateDOMNesting('span', this, parentInfo);
      }
    }

    var domID = nativeContainerInfo._idCounter++;
    this._domID = domID;
    this._nativeParent = nativeParent;
    if (transaction.useCreateElement) {
      var ownerDocument = nativeContainerInfo._ownerDocument;
      var el = ownerDocument.createElement('span');
      ReactDOMComponentTree.precacheNode(this, el);
      var lazyTree = DOMLazyTree(el);
      DOMLazyTree.queueText(lazyTree, this._stringText);
      return lazyTree;
    } else {
      var escapedText = escapeTextContentForBrowser(this._stringText);

      if (transaction.renderToStaticMarkup) {
        // Normally we'd wrap this in a `span` for the reasons stated above, but
        // since this is a situation where React won't take over (static pages),
        // we can simply return the text as it is.
        return escapedText;
      }

      return (
        '<span ' + DOMPropertyOperations.createMarkupForID(domID) + '>' +
          escapedText +
        '</span>'
      );
    }
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {ReactText} nextText The next text content
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveComponent: function(nextText, transaction) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        // TODO: Save this as pending props and use performUpdateIfNecessary
        // and/or updateComponent to do the actual update for consistency with
        // other component types?
        this._stringText = nextStringText;
        DOMChildrenOperations.updateTextContent(getNode(this), nextStringText);
      }
    }
  },
  unmountComponent: function() {
    var node = getNode(this);
    ReactDOMComponentTree.uncacheNode(this);
    return node;
  },

});

ReactPerf.measureMethods(
  ReactDOMTextComponent.prototype,
  'ReactDOMTextComponent',
  {
    mountComponent: 'mountComponent',
    receiveComponent: 'receiveComponent',
  }
);

module.exports = ReactDOMTextComponent;
