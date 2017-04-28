/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServerRendering
 */

'use strict';

var ReactElement = require('ReactElement');
var ReactMarkupChecksum = require('ReactMarkupChecksum');
var ReactNoopUpdateQueue = require('ReactNoopUpdateQueue');

var createOpenTagMarkup = require('createOpenTagMarkup');
var emptyObject = require('fbjs/lib/emptyObject');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var invariant = require('fbjs/lib/invariant');
var omittedCloseTags = require('omittedCloseTags');
var traverseAllChildren = require('traverseAllChildren');

//var Readable = require('readable-stream').Readable;

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function resolve(child, context) {
  if (Array.isArray(child)) {
    throw new Error('well that was unexpected');
  }
  while (
    ReactElement.isValidElement(child) &&
    typeof child.type === 'function'
  ) {
    var Component = child.type;
    // TODO: Mask context
    var publicContext = context;
    var updater = ReactNoopUpdateQueue;
    if (shouldConstruct(Component)) {
      var inst = new Component(child.props, publicContext, updater);
      inst.props = child.props;
      inst.context = publicContext;
      inst.refs = emptyObject;
      inst.updater = updater;
      var initialState = inst.state;
      if (initialState === undefined) {
        inst.state = initialState = null;
      }
      if (inst.componentWillMount) {
        inst.componentWillMount();
        // TODO: setState in componentWillMount should work.
      }
      child = inst.render();
      var childContext = inst.getChildContext && inst.getChildContext();
      context = Object.assign({}, context, childContext);
    } else {
      child = Component(child.props, publicContext, updater);
    }
  }
  return {child, context};
}

function ReactDOMServerRenderer(element, makeStaticMarkup) {
  this.stack = [{
    children: [element],
    childIndex: 0,
    context: emptyObject,
    footer: '',
  }];
  this.idCounter = 1;
  this.exhausted = false;
  this.makeStaticMarkup = makeStaticMarkup;
}

ReactDOMServerRenderer.prototype.read = function(bytes) {
  var out = '';
  while (out.length < bytes) {
    if (this.stack.length === 0) {
      this.exhausted = true;
      break;
    }
    var frame = this.stack[this.stack.length - 1];
    if (frame.childIndex >= frame.children.length) {
      out += frame.footer;
      this.stack.pop();
      continue;
    }
    var child = frame.children[frame.childIndex++];
    out += this.render(child, frame.context);
  }
  return out;
};

ReactDOMServerRenderer.prototype.render = function(child, context) {
  if (typeof child === 'string' || typeof child === 'number') {
    if (this.makeStaticMarkup) {
      return escapeTextContentForBrowser('' + child);
    }
    return (
      '<!-- react-text: ' + this.idCounter++ + ' -->' +
      escapeTextContentForBrowser('' + child) +
      '<!-- /react-text -->'
    );
  } else {
    ({child, context} = resolve(child, context));
    if (child === null || child === false) {
      return '<!-- react-empty: ' + this.idCounter++ + ' -->';
    } else {
      return this.renderDOM(child, context);
    }
  }
};

ReactDOMServerRenderer.prototype.renderDOM = function(
  element,
  context
) {
  var tag = element.type.toLowerCase();
  var props = element.props;
  if (tag === 'input') {
    props = Object.assign({
      type: undefined,
    }, props);
  } else if (tag === 'textarea') {
    props = Object.assign({}, props, {
      value: undefined,
      children: props.value,
    });
  }

  var out = createOpenTagMarkup(
    element.type,
    tag,
    props,
    this.makeStaticMarkup,
    this.stack.length === 1,
    this.idCounter++,
    null,
  );
  var footer = '';
  if (omittedCloseTags.hasOwnProperty(tag)) {
    out += '/>';
  } else {
    out += '>';
    footer = '</' + element.type + '>';
  }
  var children = [];
  var innerMarkup = getNonChildrenInnerMarkup(props);
  if (innerMarkup != null) {
    out += innerMarkup;
  } else {
    traverseAllChildren(props.children, function(ctx, child, name) {
      if (child != null) {
        children.push(child);
      }
    });
  }
  this.stack.push({
    children,
    childIndex: 0,
    context: context,
    footer: footer,
  });
  return out;
};
function getNonChildrenInnerMarkup(props) {
  var innerHTML = props.dangerouslySetInnerHTML;
  if (innerHTML != null) {
    if (innerHTML.__html != null) {
      return innerHTML.__html;
    }
  } else {
    var content = props.children;
    if (typeof content === 'string' || typeof content === 'number') {
      return escapeTextContentForBrowser(content);
    }
  }
  return null;
}

/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://facebook.github.io/react/docs/react-dom-server.html#rendertostring
 */
function renderToString(element) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToString(): You must pass a valid ReactElement.',
  );
  var renderer = new ReactDOMServerRenderer(element, false);
  var markup = renderer.read(Infinity);
  markup = ReactMarkupChecksum.addChecksumToMarkup(markup);
  return markup;
}

/**
 * Similar to renderToString, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://facebook.github.io/react/docs/react-dom-server.html#rendertostaticmarkup
 */
function renderToStaticMarkup(element) {
  invariant(
    ReactElement.isValidElement(element),
    'renderToStaticMarkup(): You must pass a valid ReactElement.',
  );
  var renderer = new ReactDOMServerRenderer(element, true);
  var markup = renderer.read(Infinity);
  return markup;
}

var ReactDOMServerRendering = {
  renderToString: renderToString,
  renderToStaticMarkup: renderToStaticMarkup,
};

module.exports = ReactDOMServerRendering;
