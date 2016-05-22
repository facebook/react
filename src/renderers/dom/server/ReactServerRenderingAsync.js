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

'use strict';

var BeforeInputEventPlugin = require('BeforeInputEventPlugin');
var ChangeEventPlugin = require('ChangeEventPlugin');
var DOMPropertyOperations = require('DOMPropertyOperations');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventPluginRegistry = require('EventPluginRegistry');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var getNextDebugId = require('getNextDebugId');
var invariant = require('invariant');
var ReactElement = require('ReactElement');
var ReactInjection = require('ReactInjection');
var ReactInstrumentation = require('ReactInstrumentation');
var SelectEventPlugin = require('SelectEventPlugin');
var SimpleEventPlugin = require('SimpleEventPlugin');
var warning = require('warning');

var registrationNameModules = EventPluginRegistry.registrationNameModules;

// copied from ReactDOMComponent.js
// For HTML, certain tags should omit their close tag. We keep a whitelist for
// those special-case tags.
// TODO: put this somewhere shared.
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
// TODO: put this somewhere shared.
var newlineEatingTags = {
  'listing': true,
  'pre': true,
  'textarea': true,
};

var EMPTY_OBJECT = {};

// in order to get good checking of event names, we need to inject event plugins
// this was copied from ReactDefaultInjection.js
// TODO: put this somewhere shared.
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
 * @param {boolean} makeStaticMarkup if true, generate static markup (i.e. no react-text
 *  or react-empty comment nodes
 * @returns an object with one property:
 *  next(length): a function to get the next chunk of characters. length  is the number
 *    of characters to render. note, though, that this is approximate; the method can
 *    render more or fewer. Returns an object with two properties:
 *
 *    value {String}: A chunk of markup, or undefined if done === true. The chunk should
 *      be somewhere near length chars, but is not required to be.
 *    done {boolean}: true iff the markup generation is done. When done is true, value
 *      will be undefined.
 */
const render = (element, makeStaticMarkup) => {
  if (__DEV__) {
    ReactInstrumentation.debugTool.onBeginFlush();
  }
  const node = {
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
      var result = renderImpl(node, length, makeStaticMarkup, domId);
      if (result.done) {
        done = true;
      }
      return {done: false, value: result.value};
    },
  };
};

// side effect: modifies node in place.
/**
 * Recursive function that implements rendering.
 * @param {TreeNode} node a node in the component hierarchy, looks like:
 *    {
 *      element: {ReactElement} that is the element for this node
 *      root: {boolean} true if at root
 *    }
 *   this method modifies node in place as it renders the element, adding properties
 *   like children, debugIds, childIndex, context.
 * @param {Number} length the number of characters to produce, approximately
 * @param {boolean} makeStaticMarkup true iff this should generate static markup
 *   that is not intended to reconnect on client
 * @param {Object} domId an object with one attribute, value, which indicates the
 *   next domId to use
 * @param {Number} parentDebugId if in __DEV__ mode, the debug ID for the parent of this
 *   node. undefined if at root or not in __DEV__ mode
 * @param {Array} selectValues if one of our ancestors is a select tag, this array includes
 *   all the selected values. undefined or null if no selected values.
 * @returns {Object} an object with the following properties:
 *   value {String} the next chunk of the render
 *   done {boolean} true if value is the last chunk of render for this node
 *   debugId {Number} if __DEV__ the debug ID for this node. otherwise, undefined
 */
const renderImpl = (node, length, makeStaticMarkup, domId, parentDebugId, selectValues) => {
  // first, if node.element is a component type (not a dom node type), instantiate it
  // and call componentWillMount/render as needed. keep doing this until node.element
  // is a dom node.
  const {element, context, ancestorDebugIds} = getNativeComponent(node.element, node.context || {}, parentDebugId);

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

  node.element = element;
  node.context = context;

  // an empty (null or false) component translates to an empty comment node.
  if (element === null || element === false) {
    if (__DEV__) {
      instrumentAncestors(ancestorDebugIds, node.root);
    }
    return {
      done: true,
      value: makeStaticMarkup ? '' : '<!-- react-empty: ' + domId.value++ + ' -->',
      debugId: ancestorDebugIds.length > 0 ? ancestorDebugIds[0] : 0,
    };
  }

  // now, we should have a dom element (i.e. element.type is a string)
  let {props, type: rawTag} = element;
  invariant(
    typeof rawTag === 'string',
    'A ReactElement had a type of %s, when it should have been a tag name.',
    rawTag
  );

  if (__DEV__) {
    if (!node.debugIds) {
      var thisDebugId = getNextDebugId();
      ReactInstrumentation.debugTool.onSetDisplayName(thisDebugId, getDisplayName(element));
      var directParentDebugId = ancestorDebugIds.length > 0 ?
        ancestorDebugIds[ancestorDebugIds.length - 1] :
        parentDebugId;
      if (directParentDebugId) {
        ReactInstrumentation.debugTool.onSetParent(thisDebugId, directParentDebugId);
      }
      ReactInstrumentation.debugTool.onBeforeMountComponent(thisDebugId, element);

      // store all of our ancestor debug ids and our node's debug id as an array on the node.
      // we need this to call onSetChildren and onMountComponent for our ancestors before we exit.
      node.debugIds = ancestorDebugIds.concat(thisDebugId);
    }
  } else {
    node.debugIds = [];
  }

  const tag = rawTag.toLowerCase();

  // there are some situations where the props on the element don't correspond directly
  // to the attributes on the HTML tag, mostly due to form input handling. here we fix
  // up the props to more directly map to HTML attributes.
  props = canonicalizeProps(tag, props, selectValues);

  const attributes = propsToAttributes(props, tag) +
    (node.root ? ' ' + DOMPropertyOperations.createMarkupForRoot() : '') +
    (!makeStaticMarkup ? ' ' + DOMPropertyOperations.createMarkupForID(domId.value++) : '');

  // void tags in HTML cannot have any content, and they are the only tags in html5
  // allowed to be self-closing.
  if (voidTags[tag]
    && (props.children === '' || props.children === null || props.children === undefined)) {

    if (__DEV__) {
      instrumentAncestors(node.debugIds, node.root);
    }
    return {done: true, value: '<' + tag + attributes + '/>', debugId: node.debugIds[0]};
  }
  const prefix = '<' + tag + attributes + '>';
  const suffix = '</' + tag + '>';

  // if there are no props, then all we need to do is return the open and close tag.
  if (!props) {
    if (__DEV__) {
      instrumentAncestors(node.debugIds, node.root);
    }
    return {done: true, value: prefix + suffix, debugId: node.debugIds[0]};
  }

  // when we have a newline-eating tag, we have to listen to the content from
  // our children and add a leading '\n' if the content from the children starts
  // with a '\n'. we store this as a function on node.transform, which acts like a
  // Transform stream on the content from children.
  // if this is NOT a newline-eating tag, then node.transform is just the identity
  // function (i.e. a straight passthrough).
  if (!node.transform) {
    node.transform = identityTransform;
    if (newlineEatingTags[tag]) {
      node.transform = getNewlineEatingTransform();
    }
  }

  // if dangerouslySetInnerHTML is set, then that's the contents, and we ignore the children.
  // TODO: error or warn if there are children and a dangerouslySetInnerHTML prop.
  if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html) {
    // note that we do not call escapeTextContentForBrowser; this is intentional, since
    // this is an explicit dangerous innerHTML call.
    if (__DEV__) {
      instrumentAncestors(node.debugIds, node.root);
    }
    return {
      done: true,
      value: prefix + node.transform(props.dangerouslySetInnerHTML.__html) + suffix,
      debugId: node.debugIds[0],
    };
  }

  // if there are no children, then just return the open and close tags.
  if (!props.hasOwnProperty('children')
    || props.children === undefined
    || props.children === null) {

    if (__DEV__) {
      instrumentAncestors(node.debugIds, node.root);
    }
    return {done: true, value: prefix + suffix, debugId: node.debugIds[0]};
  }

  // if there a single child that is a string or number, that's the text of the node.
  // note that this if branch can't be incorporated into the child looping below because
  // the rendering is different when there's a single string or number child; there
  // are no react-text comment nodes in that case.
  if (typeof props.children === 'string' || typeof props.children === 'number') {
    const childText = escapeTextContentForBrowser(node.transform(props.children));
    if (__DEV__) {
      thisDebugId = node.debugIds[node.debugIds.length - 1];
      ReactInstrumentation.debugTool.onSetChildren(thisDebugId,
        [instrumentTextChild(thisDebugId, thisDebugId + '#text', childText)]);
      instrumentAncestors(node.debugIds, node.root);
    }
    return {done: true, value: prefix + childText + suffix, debugId: node.debugIds[0]};
  }

  // if we've gotten to this point, it means that we need to iterate through the children
  // and render each of them.
  let text = '';
  if (!node.hasOwnProperty('childIndex')) {
    // this means this is the first time we've tried to render this element's children.
    // we need to do a few things before we loop over the children. first add the
    // open tag to the text we are going to return.
    text = prefix;

    // flatten the element's children into an array, and store it at node.children.
    // storing it means that if we have to restart rendering midway through this loop, we won't
    // need to regenerate the child list when next() is called.
    const elementChildren = props.children.length ? props.children : [props.children];
    node.children = [];
    addChildrenToArray(elementChildren, node.children, node.context, domId);

    // store the index of the child we are currently working on. this needs to be
    // stored on node so that we can restart rendering if next() is called.
    node.childIndex = 0;

    if (__DEV__) {
      // we also need to keep track of the debug IDs of the children that are returned.
      node.childrenDebugIds = [];
    }
  }

  // loop through all the children of this node.
  for (; node.childIndex < node.children.length; node.childIndex++) {
    if (text.length >= length) {
      return {done: false, value: text, debugId: node.debugIds[0]};
    }

    const child = node.children[node.childIndex];

    if (typeof child === 'string' || typeof child === 'number') {
      var childText = escapeTextContentForBrowser(child);
      text += node.transform(makeStaticMarkup ?
        childText :
        '<!-- react-text: ' + domId.value++ + ' -->' +
        childText +
        '<!-- /react-text -->');
      if (__DEV__) {
        thisDebugId = node.debugIds[node.debugIds.length - 1];
        node.childrenDebugIds.push(instrumentTextChild(thisDebugId, getNextDebugId(), childText));
      }
      continue;
    }

    // if this is a select tag, we need to keep track of what is selected for our
    // descendant option tags.
    if (!selectValues) {
      selectValues = getSelectValues(tag, props);
    }
    // we have a child component, and we need to recurse into it.
    const childResults = renderImpl(child, length - text.length, makeStaticMarkup, domId,
      node.debugIds ? node.debugIds[node.debugIds.length - 1] : null, selectValues);
    text += node.transform(childResults.value);

    // if rendering of one of our descendants stopped, we should stop as well and return
    // up the call stack. since we are keeping track of where we are in the children
    // list with node.childIndex, we will come back to the correct place when next() is called.
    if (!childResults.done) {
      return {done: false, value: text, debugId: node.debugIds[0]};
    }
    if (__DEV__) {
      if (childResults.debugId) {
        node.childrenDebugIds.push(childResults.debugId);
      }
    }
  }
  // now that we are done with this element and its children, free up the instantiated
  // children.
  node.children = null;
  if (__DEV__) {
    thisDebugId = node.debugIds[node.debugIds.length - 1];
    ReactInstrumentation.debugTool.onSetChildren(thisDebugId, node.childrenDebugIds);
    instrumentAncestors(node.debugIds, node.root);
  }
  return {done: true, value: text + suffix, debugId: node.debugIds[0]};
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

// returns an array of values that are selected on this tag, if it is a select
// tag and there are values selected.
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

// add all the children to resultArray as nodes, strings, or numbers.
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

/**
 * given an element, instantiate the component and render it iteratively until
 * we get to a DOM element (i.e. string type).
 * @param {ReactElement} element the element to instantiate.
 * @param {Object} context the react context
 * @param {Number} parentDebugId the debug id of the parent to this element
 * @returns {Object} an object with three attributes:
 *   element {ReactElement} the element returned from the last instantiated component
 *   context {Object} the resulting child context
 *   ancestorDebugIds {Array} the debug IDs of the instantiated components (if in DEV mode)
 */
const getNativeComponent = (element, context, parentDebugId) => {
  if (__DEV__) {
    var debugIds = [];
  }
  while (element && typeof element.type !== 'string'
    && typeof element.type !== 'number' && typeof element.type !== 'undefined') {

    if (__DEV__) {
      var debugId = getNextDebugId();
      debugIds.push(debugId);
      ReactInstrumentation.debugTool.onSetDisplayName(debugId, getDisplayName(element));
      if (parentDebugId) {
        ReactInstrumentation.debugTool.onSetParent(debugId, parentDebugId);
      }
      ReactInstrumentation.debugTool.onBeforeMountComponent(debugId, element);
      parentDebugId = debugId;
    }
    let component = null;

    // which parts of the context should we expose to the component, if any?
    var contextToExpose = element.type.contextTypes ?
      filterContext(context, element.type.contextTypes) :
      EMPTY_OBJECT;

    // instantiate the component.
    if (shouldConstruct(element.type)) {
      component = new element.type(element.props, contextToExpose, updater);
      invariant(
        component.render,
        '%s: The component has no render method.',
        getDisplayName(element)
      );
      if (__DEV__) {
        // this is for ReactComponentTreeDevtool-test.
        if (component) {
          component._debugID = debugId;
        }
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
    context = getChildContext(component, context, element.type.childContextTypes, element);

    // finally, render the component.
    if (component && component.render) {
      element = component.render();
    } else {
      // stateless components just return an element, not a component with a render method.
      element = component;
    }
  }

  var result = {element, context};
  if (__DEV__) {
    result.ancestorDebugIds = debugIds;
  }
  return result;
};

const getChildContext = (component, context, childContextTypes, element) => {
  if (component && component.getChildContext) {
    invariant(
      childContextTypes,
      '%s: childContextTypes must be defined in order to use getChildContext().',
      getDisplayName(element)
    );
    var childContext = component.getChildContext();
    for (var childContextName in childContext) {
      invariant(
        childContextTypes.hasOwnProperty(childContextName),
        '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
        getDisplayName(element),
        childContextName
      );
    }
    // merge child context into parent context.
    context = Object.assign({}, context, childContext);
  }
  return context;
};

// given a context object and a set of context types, this method returns a subset
// of the context that only has those types. note that it does not check that the
// context values are the correct type.
const filterContext = (context, types) => {
  const result = {};
  for (var name in types) {
    result[name] = context[name];
  }
  return result;
};

// returns the markup for attributes based on these props. in order for checksums
// to validate, this method must concatenate properties in the same order as
// ReactDOMComponent._createOpenTagMarkupAndPutListeners
const propsToAttributes = (props, tagName) => {
  let result = '';

  for (var name in props) {
    if ((tagName === 'textarea' && (name === 'value' || name === 'defaultValue'))
      || (tagName === 'select' && (name === 'value' || name === 'defaultValue'))
      || !props.hasOwnProperty(name)
      || registrationNameModules.hasOwnProperty(name)) {
      continue;
    }

    var markup = DOMPropertyOperations.createMarkupForProperty(tagName, props, name);
    if (markup) {
      result += ' ' + markup;
    }
  }
  return result;
};

// copied and modified from ReactCompositeComponent.js
// TODO: put this somewhere shared.
const shouldConstruct = (Component) => {
  return Component && Component.prototype && Component.prototype.isReactComponent;
};

// this updater is handed to the component constructor; it only handles setState
// and replaceState.
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

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

const instrumentTextChild = (parentDebugId, childDebugId, text) => {
  ReactInstrumentation.debugTool.onSetDisplayName(childDebugId, '#text');
  ReactInstrumentation.debugTool.onSetParent(childDebugId, parentDebugId);
  ReactInstrumentation.debugTool.onSetText(childDebugId, text);
  ReactInstrumentation.debugTool.onBeforeMountComponent(childDebugId, text);
  ReactInstrumentation.debugTool.onMountComponent(childDebugId);
  return childDebugId;
};

// utility function to instrument the closing of an array of ancestors.
const instrumentAncestors = (ancestorDebugIds, isRoot) => {
  for (var i = ancestorDebugIds.length - 1; i > 0; i--) {
    var parent = ancestorDebugIds[i - 1];
    var child = ancestorDebugIds[i];
    ReactInstrumentation.debugTool.onMountComponent(child);
    ReactInstrumentation.debugTool.onSetChildren(parent, [child]);
  }
  ReactInstrumentation.debugTool.onMountComponent(ancestorDebugIds[0]);

  if (isRoot) {
    ReactInstrumentation.debugTool.onMountRootComponent(ancestorDebugIds[0]);
    // we have now finished rendering, so we immediately unmount the root, which
    // allows for cleanup.
    ReactInstrumentation.debugTool.onUnmountComponent(ancestorDebugIds[0]);
    ReactInstrumentation.debugTool.onEndFlush();
  }
};

module.exports = {
  render,
};
