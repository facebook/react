/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMHTMLComponent
 */

'use strict';

var DOMChildrenOperations = require('DOMChildrenOperations');
var DOMLazyTree = require('DOMLazyTree');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactInstrumentation = require('ReactInstrumentation');
var ReactPerf = require('ReactPerf');
var Danger = require('Danger');

var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var invariant = require('invariant');
var validateDOMNesting = require('validateDOMNesting');

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings between comment nodes so that they
 * can undergo the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactDOMHTMLComponent
 * @extends ReactComponent
 * @internal
 */
var ReactDOMHTMLComponent = function(text) {
  // TODO: This is really a ReactText (ReactNode), not a ReactElement
  this._currentElement = text;
  this._stringMarkup = '' + text.props.html;
  // ReactDOMComponentTree uses these:
  this._nativeNode = null;
  this._nativeParent = null;

  // Properties
  this._domID = null;
  this._mountIndex = 0;
  this._closingComment = null;
  this._commentNodes = null;
};

function renderMarkupToNodes(markup) {
  var wrap = document.createElement('div');
  wrap.innerHTML = markup;
  return wrap.firstChild;
}

Object.assign(ReactDOMHTMLComponent.prototype, {

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
      ReactInstrumentation.debugTool.onSetText(this._debugID, this._stringMarkup);

      var parentInfo;
      if (nativeParent != null) {
        parentInfo = nativeParent._ancestorInfo;
      } else if (nativeContainerInfo != null) {
        parentInfo = nativeContainerInfo._ancestorInfo;
      }

    }

    var domID = nativeContainerInfo._idCounter++;
    var openingValue = ' react-html: ' + domID + ' ';
    var closingValue = ' /react-html ';
    this._domID = domID;
    this._nativeParent = nativeParent;
    if (transaction.useCreateElement) {
      var ownerDocument = nativeContainerInfo._ownerDocument;
      var openingComment = ownerDocument.createComment(openingValue);
      var closingComment = ownerDocument.createComment(closingValue);
      var lazyTree = DOMLazyTree(ownerDocument.createDocumentFragment());
      DOMLazyTree.queueChild(lazyTree, DOMLazyTree(openingComment));

      var renderedNode = renderMarkupToNodes(this._stringMarkup);
      while (renderedNode) {
        var nextSibling = renderedNode.nextSibling;
        DOMLazyTree.queueChild(lazyTree, DOMLazyTree(renderedNode));
        renderedNode = nextSibling;
      }

      DOMLazyTree.queueChild(lazyTree, DOMLazyTree(closingComment));
      ReactDOMComponentTree.precacheNode(this, openingComment);
      this._closingComment = closingComment;
      return lazyTree;
    } else {
      if (transaction.renderToStaticMarkup) {
        // Normally we'd wrap this between comment nodes for the reasons stated
        // above, but since this is a situation where React won't take over
        // (static pages), we can simply return the text as it is.
        return this._stringMarkup;
      }

      return (
        '<!--' + openingValue + '-->' + this._stringMarkup +
        '<!--' + closingValue + '-->'
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
      var nextStringMarkup = '' + nextText.props.html;
      if (nextStringMarkup !== this._stringMarkup) {
        // TODO: Save this as pending props and use performUpdateIfNecessary
        // and/or updateComponent to do the actual update for consistency with
        // other component types?
        this._stringMarkup = nextStringMarkup;
        var commentNodes = this.getNativeNode();
        var renderedNode = renderMarkupToNodes(this._stringMarkup);
        DOMChildrenOperations.replaceDelimitedHTML(
          commentNodes[0],
          commentNodes[1],
          renderedNode,
          this._stringMarkup
        );

        if (__DEV__) {
          ReactInstrumentation.debugTool.onSetText(
            this._debugID,
            nextStringMarkup
          );
        }
      }
    }
  },

  getNativeNode: function() {
    var nativeNode = this._commentNodes;
    if (nativeNode) {
      return nativeNode;
    }
    if (!this._closingComment) {
      var openingComment = ReactDOMComponentTree.getNodeFromInstance(this);
      var node = openingComment.nextSibling;
      while (true) {
        invariant(
          node != null,
          'Missing closing comment for html component %s',
          this._domID
        );
        if (node.nodeType === 8 && node.nodeValue === ' /react-html ') {
          this._closingComment = node;
          break;
        }
        node = node.nextSibling;
      }
    }
    nativeNode = [this._nativeNode, this._closingComment];
    this._commentNodes = nativeNode;
    return nativeNode;
  },

  unmountComponent: function() {
    this._closingComment = null;
    this._commentNodes = null;
    ReactDOMComponentTree.uncacheNode(this);
  },

});

ReactPerf.measureMethods(
  ReactDOMHTMLComponent.prototype,
  'ReactDOMHTMLComponent',
  {
    mountComponent: 'mountComponent',
    receiveComponent: 'receiveComponent',
  }
);

module.exports = ReactDOMHTMLComponent;
