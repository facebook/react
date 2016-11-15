/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiberComponent
 * @flow
 */

/* global hasOwnProperty:true */

'use strict';

var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMNamespaces = require('DOMNamespaces');
var DOMProperty = require('DOMProperty');
var DOMPropertyOperations = require('DOMPropertyOperations');
var EventPluginRegistry = require('EventPluginRegistry');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMFiberInput = require('ReactDOMFiberInput');
var ReactDOMFiberOption = require('ReactDOMFiberOption');
var ReactDOMFiberSelect = require('ReactDOMFiberSelect');
var ReactDOMFiberTextarea = require('ReactDOMFiberTextarea');

var emptyFunction = require('emptyFunction');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var focusNode = require('focusNode');
var invariant = require('invariant');
var isEventSupported = require('isEventSupported');
var setInnerHTML = require('setInnerHTML');
var setTextContent = require('setTextContent');
var shallowEqual = require('shallowEqual');
var inputValueTracking = require('inputValueTracking');
var warning = require('warning');
var didWarnShadyDOM = false;

var getNode = ReactDOMComponentTree.getNodeFromInstance;
var listenTo = ReactBrowserEventEmitter.listenTo;
var registrationNameModules = EventPluginRegistry.registrationNameModules;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
var SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
var CHILDREN = 'children';
var STYLE = 'style';
var HTML = '__html';

// Node type for document fragments (Node.DOCUMENT_FRAGMENT_NODE).
var DOC_FRAGMENT_TYPE = 11;


function getDeclarationErrorAddendum(internalInstance) {
  if (internalInstance) {
    var owner = internalInstance._currentElement._owner || null;
    if (owner) {
      var name = owner.getName();
      if (name) {
        return ' This DOM node was rendered by `' + name + '`.';
      }
    }
  }
  return '';
}

/**
 * @param {object} component
 * @param {?object} props
 */
function assertValidProps(component, props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags[component._tag]) {
    invariant(
      props.children == null && props.dangerouslySetInnerHTML == null,
      '%s is a void element tag and must neither have `children` nor ' +
      'use `dangerouslySetInnerHTML`.%s',
      component._tag,
      component._currentElement._owner ?
        ' Check the render method of ' +
        component._currentElement._owner.getName() + '.' :
        ''
    );
  }
  if (props.dangerouslySetInnerHTML != null) {
    invariant(
      props.children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
    );
    invariant(
      typeof props.dangerouslySetInnerHTML === 'object' &&
      HTML in props.dangerouslySetInnerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
      'Please visit https://fb.me/react-invariant-dangerously-set-inner-html ' +
      'for more information.'
    );
  }
  if (__DEV__) {
    warning(
      props.innerHTML == null,
      'Directly setting property `innerHTML` is not permitted. ' +
      'For more information, lookup documentation on `dangerouslySetInnerHTML`.'
    );
    warning(
      props.suppressContentEditableWarning ||
      !props.contentEditable ||
      props.children == null,
      'A component is `contentEditable` and contains `children` managed by ' +
      'React. It is now your responsibility to guarantee that none of ' +
      'those nodes are unexpectedly modified or duplicated. This is ' +
      'probably not intentional.'
    );
    warning(
      props.onFocusIn == null &&
      props.onFocusOut == null,
      'React uses onFocus and onBlur instead of onFocusIn and onFocusOut. ' +
      'All React events are normalized to bubble, so onFocusIn and onFocusOut ' +
      'are not needed/supported by React.'
    );
  }
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
    'not a string. For example, style={{marginRight: spacing + \'em\'}} when ' +
    'using JSX.%s',
     getDeclarationErrorAddendum(component)
  );
}

function ensureListeningTo(inst, registrationName) {
  if (__DEV__) {
    // IE8 has no API for event capturing and the `onScroll` event doesn't
    // bubble.
    warning(
      registrationName !== 'onScroll' || isEventSupported('scroll', true),
      'This browser doesn\'t support the `onScroll` event'
    );
  }
  var containerInfo = inst._hostContainerInfo;
  var isDocumentFragment = containerInfo._node && containerInfo._node.nodeType === DOC_FRAGMENT_TYPE;
  var doc = isDocumentFragment ? containerInfo._node : containerInfo._ownerDocument;
  listenTo(registrationName, doc);
}

// There are so many media events, it makes sense to just
// maintain a list rather than create a `trapBubbledEvent` for each
var mediaEvents = {
  topAbort: 'abort',
  topCanPlay: 'canplay',
  topCanPlayThrough: 'canplaythrough',
  topDurationChange: 'durationchange',
  topEmptied: 'emptied',
  topEncrypted: 'encrypted',
  topEnded: 'ended',
  topError: 'error',
  topLoadedData: 'loadeddata',
  topLoadedMetadata: 'loadedmetadata',
  topLoadStart: 'loadstart',
  topPause: 'pause',
  topPlay: 'play',
  topPlaying: 'playing',
  topProgress: 'progress',
  topRateChange: 'ratechange',
  topSeeked: 'seeked',
  topSeeking: 'seeking',
  topStalled: 'stalled',
  topSuspend: 'suspend',
  topTimeUpdate: 'timeupdate',
  topVolumeChange: 'volumechange',
  topWaiting: 'waiting',
};

function trapClickOnNonInteractiveElement(inst) {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  var node = getNode(inst);
  node.onclick = emptyFunction;
}

function trapBubbledEventsLocal(inst) {
  // If a component renders to null or if another component fatals and causes
  // the state of the tree to be corrupted, `node` here can be null.
  var node = getNode(inst);
  invariant(
    node,
    'trapBubbledEvent(...): Requires node to be rendered.'
  );

  switch (inst._tag) {
    case 'iframe':
    case 'object':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topLoad',
          'load',
          node
        ),
      ];
      break;
    case 'video':
    case 'audio':

      inst._wrapperState.listeners = [];
      // Create listener for each media event
      for (var event in mediaEvents) {
        if (mediaEvents.hasOwnProperty(event)) {
          inst._wrapperState.listeners.push(
            ReactBrowserEventEmitter.trapBubbledEvent(
              event,
              mediaEvents[event],
              node
            )
          );
        }
      }
      break;
    case 'source':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topError',
          'error',
          node
        ),
      ];
      break;
    case 'img':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topError',
          'error',
          node
        ),
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topLoad',
          'load',
          node
        ),
      ];
      break;
    case 'form':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topReset',
          'reset',
          node
        ),
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topSubmit',
          'submit',
          node
        ),
      ];
      break;
    case 'input':
    case 'select':
    case 'textarea':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          node
        ),
      ];
      break;
  }
}

// For HTML, certain tags should omit their close tag. We keep a whitelist for
// those special-case tags.

var omittedCloseTags = {
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

var newlineEatingTags = {
  'listing': true,
  'pre': true,
  'textarea': true,
};

// For HTML, certain tags cannot have children. This has the same purpose as
// `omittedCloseTags` except that `menuitem` should still have its closing tag.

var voidElementTags = Object.assign({
  'menuitem': true,
}, omittedCloseTags);

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name

var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
var validatedTagCache = {};
var hasOwnProperty = {}.hasOwnProperty;

function validateDangerousTag(tag) {
  if (!hasOwnProperty.call(validatedTagCache, tag)) {
    invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag);
    validatedTagCache[tag] = true;
  }
}

function isCustomComponent(tagName, props) {
  return tagName.indexOf('-') >= 0 || props.is != null;
}

/**
 * Reconciles the properties by detecting differences in property values and
 * updating the DOM as necessary. This function is probably the single most
 * critical path for performance optimization.
 *
 * TODO: Benchmark whether checking for changed values in memory actually
 *       improves performance (especially statically positioned elements).
 * TODO: Benchmark the effects of putting workInProgress at the top since 99% of props
 *       do not change for a given reconciliation.
 * TODO: Benchmark areas that can be improved with caching.
 *
 * @private
 * @param {object} lastProps
 * @param {object} nextProps
 * @param {?DOMElement} node
 */
function updateDOMProperties(
  workInProgress,
  lastProps,
  nextProps,
  isCustomComponentTag
) {
  var propKey;
  var styleName;
  var styleUpdates;
  for (propKey in lastProps) {
    if (nextProps.hasOwnProperty(propKey) ||
       !lastProps.hasOwnProperty(propKey) ||
       lastProps[propKey] == null) {
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
               propKey === CHILDREN) {
      // TODO: Clear innerHTML. This is currently broken in Fiber because we are
      // too late to clear everything at this point because new children have
      // already been inserted.
    } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING) {
      // Noop
    } else if (registrationNameModules.hasOwnProperty(propKey)) {
      // Do nothing for deleted listeners.
    } else if (isCustomComponent(workInProgress._tag, lastProps)) {
      DOMPropertyOperations.deleteValueForAttribute(
        getNode(workInProgress),
        propKey
      );
    } else if (
        DOMProperty.properties[propKey] ||
        DOMProperty.isCustomAttribute(propKey)) {
      DOMPropertyOperations.deleteValueForProperty(getNode(workInProgress), propKey);
    }
  }
  for (propKey in nextProps) {
    var nextProp = nextProps[propKey];
    var lastProp =
      lastProps != null ? lastProps[propKey] : undefined;
    if (!nextProps.hasOwnProperty(propKey) ||
        nextProp === lastProp ||
        nextProp == null && lastProp == null) {
      continue;
    }
    if (propKey === STYLE) {
      if (__DEV__) {
        if (nextProp) {
          // Freeze the next style object so that we can assume it won't be
          // mutated. We have already warned for this in the past.
          Object.freeze(nextProp);
        }
      }
      if (lastProp) {
        // Unset styles on `lastProp` but not on `nextProp`.
        for (styleName in lastProp) {
          if (lastProp.hasOwnProperty(styleName) &&
              (!nextProp || !nextProp.hasOwnProperty(styleName))) {
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
      if (lastProp && nextProp) {
        var lastHtml = lastProp[HTML];
        var nextHtml = nextProp[HTML];
        if (lastHtml !== nextHtml) {
          if (nextHtml == null) {
            // TODO: It might be too late to clear this if we have children
            // inserted already.
          } else {
            setInnerHTML(getNode(workInProgress), '' + nextHtml);
          }
        }
      } else if (nextProp) {
        var nextHtml = nextProp[HTML];
        setInnerHTML(getNode(workInProgress), nextProp);
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string') {
        setTextContent(getNode(workInProgress), nextProp);
      } else if (typeof nextProp === 'number') {
        setTextContent(getNode(workInProgress), '' + nextProp);
      }
    } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING) {
      // Noop
    } else if (registrationNameModules.hasOwnProperty(propKey)) {
      if (nextProp) {
        ensureListeningTo(workInProgress, propKey);
      }
    } else if (isCustomComponentTag) {
      DOMPropertyOperations.setValueForAttribute(
        getNode(workInProgress),
        propKey,
        nextProp
      );
    } else if (
        DOMProperty.properties[propKey] ||
        DOMProperty.isCustomAttribute(propKey)) {
      var node = getNode(workInProgress);
      // If we're updating to null or undefined, we should remove the property
      // from the DOM node instead of inadvertently setting to a string. This
      // brings us in line with the same behavior we have on initial render.
      if (nextProp != null) {
        DOMPropertyOperations.setValueForProperty(node, propKey, nextProp);
      } else {
        DOMPropertyOperations.deleteValueForProperty(node, propKey);
      }
    }
  }
  if (styleUpdates) {
    CSSPropertyOperations.setValueForStyles(
      getNode(workInProgress),
      styleUpdates,
      workInProgress
    );
  }
}

var ReactDOMFiberComponent = {


  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {?ReactDOMComponent} the parent component instance
   * @param {?object} info about the host container
   * @param {object} context
   * @return {string} The computed markup.
   */
  mountComponent: function(
    workInProgress : Fiber,
    hostParent,
    hostContainerInfo,
    context
  ) {
    // validateDangerousTag(tag);
    // workInProgress._tag = tag.toLowerCase();

    workInProgress._hostParent = hostParent;
    workInProgress._hostContainerInfo = hostContainerInfo;

    var props = workInProgress._currentElement.props;

    switch (workInProgress._tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
        workInProgress._wrapperState = {
          listeners: null,
        };
        trapBubbledEventsLocal(workInProgress);
        break;
      case 'input':
        ReactDOMFiberInput.mountWrapper(workInProgress, props, hostParent);
        props = ReactDOMFiberInput.getHostProps(workInProgress, props);
        inputValueTracking.track(workInProgress);
        trapBubbledEventsLocal(workInProgress);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(workInProgress, 'onChange');
        break;
      case 'option':
        ReactDOMFiberOption.mountWrapper(workInProgress, props, hostParent);
        props = ReactDOMFiberOption.getHostProps(workInProgress, props);
        break;
      case 'select':
        ReactDOMFiberSelect.mountWrapper(workInProgress, props, hostParent);
        props = ReactDOMFiberSelect.getHostProps(workInProgress, props);
        trapBubbledEventsLocal(workInProgress);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(workInProgress, 'onChange');
        break;
      case 'textarea':
        ReactDOMFiberTextarea.mountWrapper(workInProgress, props, hostParent);
        props = ReactDOMFiberTextarea.getHostProps(workInProgress, props);
        inputValueTracking.track(workInProgress);
        trapBubbledEventsLocal(workInProgress);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(workInProgress, 'onChange');
        break;
    }

    assertValidProps(workInProgress, props);

    // We create tags in the namespace of their parent container, except HTML
    // tags get no namespace.
    var namespaceURI;
    var parentTag;
    if (hostParent != null) {
      namespaceURI = hostParent._namespaceURI;
      parentTag = hostParent._tag;
    } else if (hostContainerInfo._tag) {
      namespaceURI = hostContainerInfo._namespaceURI;
      parentTag = hostContainerInfo._tag;
    }
    if (namespaceURI == null ||
        namespaceURI === DOMNamespaces.svg && parentTag === 'foreignobject') {
      namespaceURI = DOMNamespaces.html;
    }
    if (namespaceURI === DOMNamespaces.html) {
      if (workInProgress._tag === 'svg') {
        namespaceURI = DOMNamespaces.svg;
      } else if (workInProgress._tag === 'math') {
        namespaceURI = DOMNamespaces.mathml;
      }
    }
    workInProgress._namespaceURI = namespaceURI;

    var mountImage;
    var type = workInProgress._currentElement.type;
    var ownerDocument = hostContainerInfo._ownerDocument;
    var el;
    if (namespaceURI === DOMNamespaces.html) {
      if (workInProgress._tag === 'script') {
        // Create the script via .innerHTML so its "parser-inserted" flag is
        // set to true and it does not execute
        var div = ownerDocument.createElement('div');
        div.innerHTML = `<${type}></${type}>`;
        el = div.removeChild(div.firstChild);
      } else if (props.is) {
        el = ownerDocument.createElement(type, props.is);
      } else {
        // Separate else branch instead of using `props.is || undefined` above becuase of a Firefox bug.
        // See discussion in https://github.com/facebook/react/pull/6896
        // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
        el = ownerDocument.createElement(type);
      }
    } else {
      el = ownerDocument.createElementNS(
        namespaceURI,
        type
      );
    }
    var isCustomComponentTag = isCustomComponent(workInProgress._tag, props);
    if (__DEV__ && isCustomComponentTag && !didWarnShadyDOM && el.shadyRoot) {
      var owner = workInProgress._currentElement._owner;
      var name = owner && owner.getName() || 'A component';
      warning(
        false,
        '%s is using shady DOM. Using shady DOM with React can ' +
        'cause things to break subtly.',
        name
      );
      didWarnShadyDOM = true;
    }
    ReactDOMComponentTree.precacheFiberNode(workInProgress, el);
    if (!workInProgress._hostParent) {
      DOMPropertyOperations.setAttributeForRoot(el);
    }
    updateDOMProperties(workInProgress, null, props, isCustomComponentTag);

    switch (workInProgress._tag) {
      case 'input':
        ReactDOMFiberInput.postMountWrapper(workInProgress);
        if (props.autoFocus) {
          focusNode(getNode(workInProgress));
        }
        break;
      case 'textarea':
        ReactDOMFiberTextarea.postMountWrapper(workInProgress);
        if (props.autoFocus) {
          focusNode(getNode(workInProgress));
        }
        break;
      case 'select':
        if (props.autoFocus) {
          focusNode(getNode(workInProgress));
        }
        break;
      case 'button':
        if (props.autoFocus) {
          focusNode(getNode(workInProgress));
        }
        break;
      case 'option':
        ReactDOMFiberOption.postMountWrapper(workInProgress);
        break;
      default:
        if (typeof props.onClick === 'function') {
          trapClickOnNonInteractiveElement(workInProgress);
        }
        break;
    }

    return el;
  },


  /**
   * Receives a next element and updates the component.
   *
   * @internal
   * @param {ReactElement} nextElement
   * @param {object} context
   */
  receiveComponent: function(workInProgress : Fiber, nextElement, context) {
    var prevElement = workInProgress._currentElement;
    workInProgress._currentElement = nextElement;

    var lastProps = prevElement.props;
    var nextProps = workInProgress._currentElement.props;

    switch (workInProgress._tag) {
      case 'input':
        lastProps = ReactDOMFiberInput.getHostProps(workInProgress, lastProps);
        nextProps = ReactDOMFiberInput.getHostProps(workInProgress, nextProps);
        break;
      case 'option':
        lastProps = ReactDOMFiberOption.getHostProps(workInProgress, lastProps);
        nextProps = ReactDOMFiberOption.getHostProps(workInProgress, nextProps);
        break;
      case 'select':
        lastProps = ReactDOMFiberSelect.getHostProps(workInProgress, lastProps);
        nextProps = ReactDOMFiberSelect.getHostProps(workInProgress, nextProps);
        break;
      case 'textarea':
        lastProps = ReactDOMFiberTextarea.getHostProps(workInProgress, lastProps);
        nextProps = ReactDOMFiberTextarea.getHostProps(workInProgress, nextProps);
        break;
      default:
        if (typeof lastProps.onClick !== 'function' &&
            typeof nextProps.onClick === 'function') {
          trapClickOnNonInteractiveElement(workInProgress);
        }
        break;
    }

    assertValidProps(workInProgress, nextProps);
    var isCustomComponentTag = isCustomComponent(workInProgress._tag, nextProps);
    updateDOMProperties(workInProgress, lastProps, nextProps, isCustomComponentTag);

    switch (workInProgress._tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        ReactDOMFiberInput.updateWrapper(workInProgress);
        break;
      case 'textarea':
        ReactDOMFiberTextarea.updateWrapper(workInProgress);
        break;
      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        ReactDOMFiberSelect.postUpdateWrapper(workInProgress);
        break;
    }
  },

  /**
   * Destroys all event registrations for workInProgress instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function(safely, skipLifecycle) {
    switch (workInProgress._tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
        var listeners = workInProgress._wrapperState.listeners;
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            listeners[i].remove();
          }
        }
        break;
      case 'input':
      case 'textarea':
        inputValueTracking.stopTracking(workInProgress);
        break;
      case 'html':
      case 'head':
      case 'body':
        /**
         * Components like <html> <head> and <body> can't be removed or added
         * easily in a cross-browser way, however it's valuable to be able to
         * take advantage of React's reconciliation for styling and <title>
         * management. So we just document it and throw in dangerous cases.
         */
        invariant(
          false,
          '<%s> tried to unmount. Because of cross-browser quirks it is ' +
          'impossible to unmount some top-level components (eg <html>, ' +
          '<head>, and <body>) reliably and efficiently. To fix workInProgress, have a ' +
          'single top-level component that never unmounts render these ' +
          'elements.',
          workInProgress._tag
        );
        break;
    }

    ReactDOMComponentTree.uncacheNode(workInProgress);
    workInProgress._wrapperState = null;
  },

  restoreControlledState: function(finishedWork : Fiber) {
    switch (finishedWork.type) {
      case 'input':
        ReactDOMFiberInput.restoreControlledState(finishedWork);
        return;
      case 'textarea':
        ReactDOMFiberTextarea.restoreControlledState(finishedWork);
        return;
      case 'select':
        ReactDOMFiberSelect.restoreControlledState(finishedWork);
        return;
    }
  },

  getPublicInstance: function(fiber : Fiber) {
    // If we add wrappers, this could be something deeper.
    return fiber.stateNode;
  },

};

module.exports = ReactDOMFiberComponent;
