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
 * @providesModule ReactNativeComponent
 * @typechecks static-only
 */

"use strict";

var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMPropertyOperations = require('DOMPropertyOperations');
var ReactComponent = require('ReactComponent');
var ReactEventEmitter = require('ReactEventEmitter');
var ReactMultiChild = require('ReactMultiChild');
var ReactID = require('ReactID');

var escapeTextForBrowser = require('escapeTextForBrowser');
var flattenChildren = require('flattenChildren');
var invariant = require('invariant');
var keyOf = require('keyOf');
var merge = require('merge');
var mixInto = require('mixInto');

var putListener = ReactEventEmitter.putListener;
var deleteListener = ReactEventEmitter.deleteListener;
var registrationNames = ReactEventEmitter.registrationNames;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var CONTENT = keyOf({content: null});
var DANGEROUSLY_SET_INNER_HTML = keyOf({dangerouslySetInnerHTML: null});
var STYLE = keyOf({style: null});

/**
 * @param {?object} props
 */
function assertValidProps(props) {
  if (!props) {
    return;
  }
  // Note the use of `!=` which checks for null or undefined.
  var hasChildren = props.children != null ? 1 : 0;
  var hasContent = props.content != null ? 1 : 0;
  var hasInnerHTML = props.dangerouslySetInnerHTML != null ? 1 : 0;
  invariant(
    hasChildren + hasContent + hasInnerHTML <= 1,
    'Can only set one of `children`, `props.content`, or ' +
    '`props.dangerouslySetInnerHTML`.'
  );
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
    'not a string.'
  );
}

/**
 * @constructor ReactNativeComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 */
function ReactNativeComponent(tag, omitClose) {
  this._tagOpen = '<' + tag + ' ';
  this._tagClose = omitClose ? '' : '</' + tag + '>';
  this.tagName = tag.toUpperCase();
}

ReactNativeComponent.Mixin = {

  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {string} rootID The root DOM ID for this node.
   * @param {ReactReconcileTransaction} transaction
   * @return {string} The computed markup.
   */
  mountComponent: function(rootID, transaction) {
    ReactComponent.Mixin.mountComponent.call(this, rootID, transaction);
    assertValidProps(this.props);
    return (
      this._createOpenTagMarkup() +
      this._createContentMarkup(transaction) +
      this._tagClose
    );
  },

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkup: function() {
    var props = this.props;
    var ret = this._tagOpen;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNames[propKey]) {
        putListener(this._rootNodeID, propKey, propValue);
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            propValue = props.style = merge(props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
        }
        var markup =
          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    return ret + ' ' + ReactID.ATTR_NAME + '="' + this._rootNodeID + '">';
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = this.props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        return innerHTML.__html;
      }
    } else {
      var contentToUse = this.props.content != null ? this.props.content :
        CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;
      var childrenToUse = contentToUse != null ? null : this.props.children;
      if (contentToUse != null) {
        return escapeTextForBrowser(contentToUse);
      } else if (childrenToUse != null) {
        return this.mountMultiChild(
          flattenChildren(childrenToUse),
          transaction
        );
      }
    }
    return '';
  },

  /**
   * Controls a native DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @internal
   * @param {object} nextProps
   * @param {ReactReconcileTransaction} transaction
   */
  receiveProps: function(nextProps, transaction) {
    ReactComponent.Mixin.receiveProps.call(this, nextProps, transaction);
    assertValidProps(nextProps);
    this._updateDOMProperties(nextProps);
    this._updateDOMChildren(nextProps, transaction);
    this.props = nextProps;
  },

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} nextProps
   */
  _updateDOMProperties: function(nextProps) {
    var lastProps = this.props;
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) ||
         !lastProps.hasOwnProperty(propKey)) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML ||
                 propKey === CONTENT) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          ''
        );
      } else if (registrationNames[propKey]) {
        deleteListener(this._rootNodeID, propKey);
      } else {
        ReactComponent.DOMIDOperations.deletePropertyByID(
          this._rootNodeID,
          propKey
        );
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps[propKey];
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = nextProps.style = merge(nextProp);
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) &&
                !nextProp.hasOwnProperty(styleName)) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        var lastHtml = lastProp && lastProp.__html;
        var nextHtml = nextProp && nextProp.__html;
        if (lastHtml !== nextHtml) {
          ReactComponent.DOMIDOperations.updateInnerHTMLByID(
            this._rootNodeID,
            nextProp
          );
        }
      } else if (propKey === CONTENT) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          '' + nextProp
        );
      } else if (registrationNames[propKey]) {
        putListener(this._rootNodeID, propKey, nextProp);
      } else {
        ReactComponent.DOMIDOperations.updatePropertyByID(
          this._rootNodeID,
          propKey,
          nextProp
        );
      }
    }
    if (styleUpdates) {
      ReactComponent.DOMIDOperations.updateStylesByID(
        this._rootNodeID,
        styleUpdates
      );
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} nextProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMChildren: function(nextProps, transaction) {
    var thisPropsContentType = typeof this.props.content;
    var thisPropsContentEmpty =
      this.props.content == null || thisPropsContentType === 'boolean';
    var nextPropsContentType = typeof nextProps.content;
    var nextPropsContentEmpty =
      nextProps.content == null || nextPropsContentType === 'boolean';

    var lastUsedContent = !thisPropsContentEmpty ? this.props.content :
      CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;

    var contentToUse = !nextPropsContentEmpty ? nextProps.content :
      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    // Note the use of `!=` which checks for null or undefined.

    var lastUsedChildren =
      lastUsedContent != null ? null : this.props.children;
    var childrenToUse = contentToUse != null ? null : nextProps.children;

    if (contentToUse != null) {
      var childrenRemoved = lastUsedChildren != null && childrenToUse == null;
      if (childrenRemoved) {
        this.updateMultiChild(null, transaction);
      }
      if (lastUsedContent !== contentToUse) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          '' + contentToUse
        );
      }
    } else {
      var contentRemoved = lastUsedContent != null && contentToUse == null;
      if (contentRemoved) {
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          ''
        );
      }
      this.updateMultiChild(flattenChildren(nextProps.children), transaction);
    }
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function() {
    ReactEventEmitter.deleteAllListeners(this._rootNodeID);
    ReactComponent.Mixin.unmountComponent.call(this);
    this.unmountMultiChild();
  }

};

mixInto(ReactNativeComponent, ReactComponent.Mixin);
mixInto(ReactNativeComponent, ReactNativeComponent.Mixin);
mixInto(ReactNativeComponent, ReactMultiChild.Mixin);

module.exports = ReactNativeComponent;
