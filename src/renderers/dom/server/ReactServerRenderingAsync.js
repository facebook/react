/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactServerRenderingAsync
 */

/**
tree node looks like:

{
  element: ReactElement that is this tree node
  root: true if at root
  childIndex: which child this node is at
}
*/

'use strict';

var BeforeInputEventPlugin = require('BeforeInputEventPlugin');
var ChangeEventPlugin = require('ChangeEventPlugin');
var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMPropertyOperations = require('DOMPropertyOperations');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventPluginRegistry = require('EventPluginRegistry');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var invariant = require('invariant');
var ReactElement = require('ReactElement');
var ReactInjection = require('ReactInjection');
var SelectEventPlugin = require('SelectEventPlugin');
var SimpleEventPlugin = require('SimpleEventPlugin');
var warning = require('warning');

var registrationNameModules = EventPluginRegistry.registrationNameModules;

// copied from ReactDOMComponent.js
// For HTML, certain tags should omit their close tag. We keep a whitelist for
// those special-case tags.
const voidTags = {
  'area': true,
  'base': true,
  'br': true,
  'col': true,
  'embed': true,
  'hr': true,
  'img': true,
  'input': true,
  'keygen': true,
  'link': true,
  'meta': true,
  'param': true,
  'source': true,
  'track': true,
  'wbr': true,
  // NOTE: menuitem's close tag should be omitted, but that causes problems.
};

// copied from ReactDOMComponent.js
var newlineEatingTags = {
  'listing': true,
  'pre': true,
  'textarea': true,
};

var EMPTY_OBJECT = {};

// in order to get good checking of event names, we need to inject event plugins
// this was copied from ReactDefaultInjection.js
ReactInjection.EventPluginHub.injectEventPluginsByName({
  SimpleEventPlugin: SimpleEventPlugin,
  EnterLeaveEventPlugin: EnterLeaveEventPlugin,
  ChangeEventPlugin: ChangeEventPlugin,
  SelectEventPlugin: SelectEventPlugin,
  BeforeInputEventPlugin: BeforeInputEventPlugin,
});


/**
 * render the element in question to a string.
 * @param {ReactElement} element the element to render
 * @param {int} length the number of characters to render. note that this is approximate;
 *  the method can render more or fewer.
 * @param {boolean} makeStaticMarkup if true, generate static markup (i.e. no react-text
 *  or react-empty comment nodes
 * @returns an object with two properties:
 *  text: the rendered string
 *  next(length): a function to get the next length characters. returns a similar
 *   {text, next} object or null if the render is done.
 */
const render = (element, makeStaticMarkup) => {
  const tree = {
    element,
    root: !makeStaticMarkup,
  };
  var domId = {value: 1};
  var done = false;
  return {
    next: length => {
      if (done) {
        return {done: true, value: undefined};
      }
      var result = renderImpl(tree, length, makeStaticMarkup, domId);
      if (result.done) {
        done = true;
      }
      return {done: false, value: result.value};
    },
  };
};

// side effect: modifies tree in place.
const renderImpl = (tree, length, makeStaticMarkup, domId, selectValues) => {
  // first, if tree.element is a component type (not a dom node type), instantiate it
  // and call componentWillMount/render as needed. keep doing this until tree.element
  // is a dom node.
  const {element, context} = getNativeComponent(tree.element, tree.context || {});

  // it's odd to warn and then invariant on this, but it's replicating current behavior.
  if (__DEV__) {
    warning(
      element === null || element === false || ReactElement.isValidElement(element),
      '%s(...): A valid React element (or null) must be returned. You may have ' +
      'returned undefined, an array or some other invalid object.',
      'Component' // TODO: get a proper name here.
    );
  }
  invariant(
    element === null || element === false || ReactElement.isValidElement(element),
    '%s(...): A valid React element (or null) must be returned. You may have ' +
    'returned undefined, an array or some other invalid object.',
    'Component' // TODO: get a proper name here.
  );

  tree.element = element;
  tree.context = context;

  // an empty (null or false) component translates to an empty comment node.
  if (element === null || element === false) {
    return {done: true, value: makeStaticMarkup ? '' : '<!-- react-empty: ' + domId.value++ + ' -->'};
  }

  // now, we should have a dom element (element.type is a string)
  let {props, type: rawTag} = element;
  if (typeof rawTag !== 'string') {
    throw new Error(`A ReactElement had a type of '${rawTag}', when it should have been a tag name.`);
  }
  const tag = rawTag.toLowerCase();

  props = canonicalizeProps(tag, props, selectValues);

  const attributes = propsToAttributes(props, tag) +
    (tree.root ? ' ' + DOMPropertyOperations.createMarkupForRoot() : '') +
    (!makeStaticMarkup ? ' ' + DOMPropertyOperations.createMarkupForID(domId.value++) : '');
  if (voidTags[tag]
    && (props.children === '' || props.children === null || props.children === undefined)) {

    // TODO: maybe we should omit the trailing slash here? shouldn't be needed in html5.
    return {done: true, value: '<' + tag + attributes + '/>'};
  }
  const prefix = '<' + tag + attributes + '>';
  const suffix = '</' + tag + '>';

  if (!props) {
    return {done: true, value: prefix + suffix};
  }

  // when we have a newline-eating tag, we have to listen to the content from
  // our children and add a leading '\n' if the content from the children starts
  // with a '\n'. we store this as a function on tree.transform, which acts like a
  // Transform stream on the content from children.
  // if this is NOT a newline-eating tag, then tree.transform is just the identity
  // function (i.e. a straight passthrough).
  if (!tree.transform) {
    tree.transform = identityTransform;
    if (newlineEatingTags[tag]) {
      tree.transform = getNewlineEatingTransform();
    }
  }

  // if dangerouslySetInnerHTML is set, then that's the contents, and we ignore the children.
  // TODO: error or warn if there are children and a dangerouslySetInnerHTML prop.
  if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html) {
    // note that we do not call escapeTextContentForBrowser; this is intentional, since
    // this is an explicit dangerous innerHTML call.
    return {done: true, value: prefix + tree.transform(props.dangerouslySetInnerHTML.__html) + suffix};
  }

  if (!props.hasOwnProperty('children')
    || props.children === undefined
    || props.children === null) {
    return {done: true, value: prefix + suffix};
  }

  // if there a single child that is a string or number, that's the text of the node.
  // note that this if branch can't be incorporated into the child looping below because
  // the rendering is different when there's a single string or number child; there
  // are no react-text comment nodes in that case.
  if (typeof props.children === 'string' || typeof props.children === 'number') {
    return {done: true, value: prefix + escapeTextContentForBrowser(tree.transform(props.children)) + suffix};
  }

  // if we've gotten to this point, it means that we need to iterate through the children
  // and render each of them.
  let text = '';
  if (!tree.hasOwnProperty('childIndex')) {
    // this means this is the first time we've tried to render this element's children.
    // we need to do a few things before we loop over the children.
    text = prefix;

    // flatten the element's children into an array, and store it at tree.children.
    // storing it means that if we have to restart rendering midway through this loop, we won't
    // need to regenerate the child list when next() is called.
    const elementChildren = props.children.length ? props.children : [props.children];
    tree.children = [];
    addChildrenToArray(elementChildren, tree.children, tree.context, domId);

    // store the index of the child we are currently working on. this needs to be
    // stored on tree so that we can restart rendering if next() is called.
    tree.childIndex = 0;
  }

  for (; tree.childIndex < tree.children.length; tree.childIndex++) {
    if (text.length >= length) {
      return {done: false, value: text};
    }

    const child = tree.children[tree.childIndex];

    if (typeof child === 'string' || typeof child === 'number') {
      text += tree.transform(makeStaticMarkup ?
        escapeTextContentForBrowser(child) :
        '<!-- react-text: ' + domId.value++ + ' -->' +
        escapeTextContentForBrowser(child) +
        '<!-- /react-text -->');
      continue;
    }

    if (!selectValues) {
      selectValues = getSelectValues(tag, props);
    }
    // we have a child component, and we need to recurse into it.
    const childResults = renderImpl(child, length - text.length, makeStaticMarkup, domId, selectValues);
    text += tree.transform(childResults.value);

    // if rendering of one of our descendants stopped, we should stop as well and return
    // up the call stack. since we are keeping track of where we are in the children
    // list with tree.childIndex, we will come back to the correct place when next() is called.
    if (!childResults.done) {
      return {done: false, value: text};
    }
  }
  // now that we are done with this element, free up the instantiated children.
  tree.children = null;
  return {done: true, value: text + suffix};
};

const identityTransform = (text) => text;

const getNewlineEatingTransform = () => {
  var isFirstText = true;
  return (text) => {
    if (isFirstText && text.length !== 0) {
      isFirstText = false;
      if (text.charAt(0) === '\n') {
        return '\n' + text;
      }
    }
    return text;
  };
};

// props don't always correspond directly to attributes, especially when it comes
// to form inputs (input, select, textarea). this method returns the props that
// should be used for this element. it also throws some warnings when props are
// poorly set up.
const canonicalizeProps = (tag, props, selectValues) => {
  // TODO: make this DRYer; there's a lot of repeated logic.
  if (tag === 'input') {
    // check to see if this is a controlled input without onChange or readOnly.
    warning(
      !props.hasOwnProperty('checked') || props.onChange || props.readOnly,
      'Failed form propType: You provided a `checked` prop to a form field without an ' +
      '`onChange` handler. This will render a read-only field. If the field should ' +
      'be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`.');
    warning(
      !(props.hasOwnProperty('checked') && props.hasOwnProperty('defaultChecked')),
      '%s elements must be either controlled or uncontrolled (specify either the ' +
      'checked prop, or the defaultChecked prop, but not both). Decide between using a ' +
      'controlled or uncontrolled input element and remove one of these props. ' +
      'More info: https://fb.me/react-controlled-components',
      tag);
  }
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    // check to see if this is a controlled input without onChange or readOnly.
    warning(
      !props.hasOwnProperty('value') || props.onChange || props.readOnly,
      'Failed form propType: You provided a `value` prop to a form field without an ' +
      '`onChange` handler. This will render a read-only field. If the field should ' +
      'be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.');
    warning(
      !(props.hasOwnProperty('value') && props.hasOwnProperty('defaultValue')),
      '%s elements must be either controlled or uncontrolled (specify either the ' +
      'value prop, or the defaultValue prop, but not both). Decide between using a ' +
      'controlled or uncontrolled input element and remove one of these props. ' +
      'More info: https://fb.me/react-controlled-components',
      tag);
  }
  // TODO: warn about textarea having (value || defaultValue) and children

  // if there are select values, check to see if this is an option tag
  // that should be selected.
  if (selectValues && tag === 'option') {
    var optionValue = props.value;
    if (optionValue) {
      for (const selectValue of selectValues) {
        if (selectValue === optionValue) {
          props = Object.assign({selected: true}, props);
          break;
        }
      }
    }
  }

  // convert default[Checked|Value] into [checked|value]
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    props = Object.assign(
      {},
      props,
      !props.hasOwnProperty('checked') && props.hasOwnProperty('defaultChecked') ? {
        checked: props.defaultChecked,
      } : {},
      !props.hasOwnProperty('value') && props.hasOwnProperty('defaultValue') ? {
        value: props.defaultValue,
      } : {},
      {
        defaultChecked: undefined,
        defaultValue: undefined,
      });
    if (tag === 'textarea') {
      Object.assign(props, {children: props.value, value: undefined});
    }
  }
  return props;
};

const getSelectValues = (tag, props) => {
  let result = null;
  if (tag === 'select' && (props.hasOwnProperty('value') || props.hasOwnProperty('defaultValue'))) {
    result = props.value || props.defaultValue;
    if (!Array.isArray(result)) {
      result = [result];
    }
  }
  return result;
};

const addChildrenToArray = (children, resultArray, context, domId) => {
  for (var i = 0; i < children.length; i++) {
    const child = children[i];
    if (Array.isArray(child)) {
      addChildrenToArray(child, resultArray, context, domId);
    } else if (child === null || child === false) {
      // null and false children do NOT result in an empty node; they just aren't rendered.
      continue;
    } else if (typeof child === 'object') {
      resultArray.push({element: child, context, domId});
    } else {
      resultArray.push(child);
    }
  }
};

const getNativeComponent = (element, context) => {
  while (element && typeof element.type !== 'string'
    && typeof element.type !== 'number' && typeof element.type !== 'undefined') {

    let component = null;

    // which parts of the context should we expose to the component, if any?
    var contextToExpose = element.type.contextTypes ?
      filterContext(context, element.type.contextTypes) :
      EMPTY_OBJECT;

    // instantiate the component.
    if (shouldConstruct(element.type)) {
      component = new element.type(element.props, contextToExpose, updater);
      if (!component.render) {
        // TODO: get the component display name for the error.
        throw new Error('The component has no render method.');
      }
    } else if (typeof element.type === 'function') {
      // just call as function for stateless components or factory components.
      component = element.type(element.props, contextToExpose);
    }

    // if it has a componentWillMount method, we need to fire it now.
    if (component && component.componentWillMount) {
      component.componentWillMount();
    }

    // if setState or replaceState was called in componentWillMount, we need to
    // fire those calls now.
    updater.drainQueue();

    // now handle child context if this component has getChildContext.
    context = getChildContext(component, context, element.type.childContextTypes);

    // finally, render the component.
    if (component && component.render) {
      element = component.render();
    } else {
      // stateless components just return an element, not a component with a render method.
      element = component;
    }
  }
  return {element, context};
};

const getChildContext = (component, context, childContextTypes) => {
  if (component && component.getChildContext) {
    if (!childContextTypes) {
      // TODO: how best to get the component display name here?
      throw new Error('childContextTypes must be defined in order to use getChildContext().');
    }
    var childContext = component.getChildContext();
    for (var childContextName in childContext) {
      if (!childContextTypes.hasOwnProperty(childContextName)) {
        // TODO: how best to get the component display name here?
        throw new Error(`getChildContext(): key "${childContextName}" is not defined in childContextTypes.`);
      }
    }
    // merge child context into parent context.
    context = Object.assign({}, context, childContext);
  }
  return context;
};

const filterContext = (context, types) => {
  const result = {};
  for (var name in types) {
    result[name] = context[name];
  }
  return result;
};

const propsToAttributes = (props, tagName) => {
  let result = '';

  for (var name in props) {
    if ((tagName === 'textarea' && (name === 'value' || name === 'defaultValue'))
      || (tagName === 'select' && (name === 'value' || name === 'defaultValue'))
      || !props.hasOwnProperty(name)
      || registrationNameModules.hasOwnProperty(name)) {
      continue;
    }

    let value = props[name];

    if (name === 'style') {
      value = CSSPropertyOperations.createMarkupForStyles(value);
      if (value === null) {
        continue;
      }
    }

    var markup = DOMPropertyOperations.createMarkupForProperty(name, value);
    if (markup) {
      result += ' ' + markup;
    }
  }
  return result;
};

// copied and modified from ReactCompositeComponent.js
const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
};

const updater = {
  queue: [],

  isMounted: function(publicInstance) {
    return false;
  },

  enqueueCallback: function(publicInstance, callback) {
    if (callback) {
      this.queue.push(callback);
    }
  },

  // no-op
  enqueueForceUpdate: function(publicInstance) { },

  enqueueReplaceState: function(publicInstance, completeState) {
    this.queue.push(replaceState.bind(publicInstance, completeState));
  },

  enqueueSetState: function(publicInstance, partialState) {
    this.queue.push(setState.bind(publicInstance, partialState));
  },

  drainQueue: function() {
    for (const fn of this.queue) {
      fn();
    }
    this.queue = [];
  },
};

function setState(partialStateOrFn) {
  var partialState;

  if (typeof partialStateOrFn === 'function') {
    partialState = partialStateOrFn(this.state, this.props);
  } else {
    partialState = partialStateOrFn;
  }

  this.state = Object.assign({}, this.state, partialState);
}

function replaceState(partialStateOrFn) {
  if (typeof partialStateOrFn === 'function') {
    this.state = partialStateOrFn(this.state, this.props);
  } else {
    this.state = partialStateOrFn;
  }
}

module.exports = {
  render,
};
