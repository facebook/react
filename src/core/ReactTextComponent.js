/**
 * @providesModule ReactTextComponent
 * @typechecks
 */

"use strict";

var ReactComponent = require('ReactComponent');

var escapeTextForBrowser = require('escapeTextForBrowser');
var mixInto = require('mixInto');

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
 * @class ReactTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactTextComponent = function(initialText) {
  this.construct({text: initialText});
};

mixInto(ReactTextComponent, ReactComponent.Mixin);
mixInto(ReactTextComponent, {

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {string} rootID DOM ID of the root node.
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(rootID) {
    ReactComponent.Mixin.mountComponent.call(this, rootID);
    return (
      '<span id="' + rootID + '">' +
        escapeTextForBrowser(this.props.text) +
      '</span>'
    );
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {object} nextProps Contains the next text content.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveProps: function(nextProps, transaction) {
    if (nextProps.text !== this.props.text) {
      this.props.text = nextProps.text;
      ReactComponent.DOMIDOperations.updateTextContentByID(
        this._rootNodeID,
        nextProps.text
      );
    }
  }

});

module.exports = ReactTextComponent;
