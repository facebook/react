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

import type { Fiber } from 'ReactFiber';

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
var focusNode = require('focusNode');
var getCurrentOwnerName = require('getCurrentOwnerName');
var invariant = require('invariant');
var isEventSupported = require('isEventSupported');
var setInnerHTML = require('setInnerHTML');
var setTextContent = require('setTextContent');
var inputValueTracking = require('inputValueTracking');
var warning = require('warning');
var didWarnShadyDOM = false;

var getNode = ReactDOMComponentTree.getNodeFromInstance;
var listenTo = ReactBrowserEventEmitter.listenTo;
var registrationNameModules = EventPluginRegistry.registrationNameModules;

var DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
var SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
var CHILDREN = 'children';
var STYLE = 'style';
var HTML = '__html';

// Node type for document fragments (Node.DOCUMENT_FRAGMENT_NODE).
var DOC_FRAGMENT_TYPE = 11;


function getDeclarationErrorAddendum() {
  var ownerName = getCurrentOwnerName();
  if (ownerName) {
    return ' This DOM node was rendered by `' + ownerName + '`.';
  }
  return '';
}

function assertValidProps(tag : string, props : ?Object) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  if (voidElementTags[tag]) {
    invariant(
      props.children == null && props.dangerouslySetInnerHTML == null,
      '%s is a void element tag and must neither have `children` nor ' +
      'use `dangerouslySetInnerHTML`.%s',
      tag,
      getDeclarationErrorAddendum()
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
     getDeclarationErrorAddendum()
  );
}

function ensureListeningTo(rootContainerElement, registrationName) {
  if (__DEV__) {
    // IE8 has no API for event capturing and the `onScroll` event doesn't
    // bubble.
    warning(
      registrationName !== 'onScroll' || isEventSupported('scroll', true),
      'This browser doesn\'t support the `onScroll` event'
    );
  }
  var isDocumentFragment = rootContainerElement.nodeType === DOC_FRAGMENT_TYPE;
  var doc = isDocumentFragment ? rootContainerElement : rootContainerElement.ownerDocument;
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

function trapBubbledEventsLocal(inst, tag) {
  // If a component renders to null or if another component fatals and causes
  // the state of the tree to be corrupted, `node` here can be null.
  var node = getNode(inst);
  invariant(
    node,
    'trapBubbledEvent(...): Requires node to be rendered.'
  );

  // TODO: Make sure that we check isMounted before firing any of these events.
  switch (tag) {
    case 'iframe':
    case 'object':
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topLoad',
        'load',
        node
      );
      break;
    case 'video':
    case 'audio':
      // Create listener for each media event
      for (var event in mediaEvents) {
        if (mediaEvents.hasOwnProperty(event)) {
          ReactBrowserEventEmitter.trapBubbledEvent(
            event,
            mediaEvents[event],
            node
          );
        }
      }
      break;
    case 'source':
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topError',
        'error',
        node
      );
      break;
    case 'img':
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topError',
        'error',
        node
      );
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topLoad',
        'load',
        node
      );
      break;
    case 'form':
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topReset',
        'reset',
        node
      );
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topSubmit',
        'submit',
        node
      );
      break;
    case 'input':
    case 'select':
    case 'textarea':
      ReactBrowserEventEmitter.trapBubbledEvent(
        'topInvalid',
        'invalid',
        node
      );
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

// For HTML, certain tags cannot have children. This has the same purpose as
// `omittedCloseTags` except that `menuitem` should still have its closing tag.

var voidElementTags = {
  'menuitem': true,
  ...omittedCloseTags,
};

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
 */
function updateDOMProperties(
  workInProgress : Fiber,
  rootContainerElement : Element,
  lastProps : null | Object,
  nextProps : Object,
  wasCustomComponentTag : boolean,
  isCustomComponentTag : boolean,
) : void {
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
    } else if (wasCustomComponentTag) {
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
      var nextHtml = nextProp ? nextProp[HTML] : undefined;
      var lastHtml = lastProp ? lastProp[HTML] : undefined;
      if (nextHtml) {
        if (lastHtml) {
          if (lastHtml !== nextHtml) {
            setInnerHTML(getNode(workInProgress), '' + nextHtml);
          }
        } else {
          setInnerHTML(getNode(workInProgress), nextHtml);
        }
      } else {
        // TODO: It might be too late to clear this if we have children
        // inserted already.
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
        ensureListeningTo(rootContainerElement, propKey);
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

  // TODO: Use this to keep track of changes to the host context and use this
  // to determine whether we switch to svg and back.
  isNewHostContainer: function(tag : string) {
    return tag === 'svg' || tag === 'foreignobject';
  },

  mountComponent: function(
    workInProgress : Fiber,
    tag : string,
    rootContainerElement : Element,
    props : Object,
    context : Object
  ) : Element {
    // TODO:
    // validateDangerousTag(tag);
    // tag.toLowerCase(); Do we need to apply lower case only on non-custom elements?

    switch (tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
        trapBubbledEventsLocal(workInProgress);
        break;
      case 'input':
        ReactDOMFiberInput.mountWrapper(workInProgress, props);
        props = ReactDOMFiberInput.getHostProps(workInProgress, props);
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        inputValueTracking.track(workInProgress);
        trapBubbledEventsLocal(workInProgress);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      case 'option':
        ReactDOMFiberOption.mountWrapper(workInProgress, props);
        props = ReactDOMFiberOption.getHostProps(workInProgress, props);
        break;
      case 'select':
        ReactDOMFiberSelect.mountWrapper(workInProgress, props);
        props = ReactDOMFiberSelect.getHostProps(workInProgress, props);
        trapBubbledEventsLocal(workInProgress);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      case 'textarea':
        ReactDOMFiberTextarea.mountWrapper(workInProgress, props);
        props = ReactDOMFiberTextarea.getHostProps(workInProgress, props);
        inputValueTracking.track(workInProgress);
        trapBubbledEventsLocal(workInProgress);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
    }

    assertValidProps(tag, props);

    // We create tags in the namespace of their parent container, except HTML
    // tags get no namespace.
    var namespaceURI = rootContainerElement.namespaceURI;
    if (namespaceURI == null ||
        namespaceURI === DOMNamespaces.svg &&
        rootContainerElement.tagName === 'foreignObject') {
      namespaceURI = DOMNamespaces.html;
    }
    if (namespaceURI === DOMNamespaces.html) {
      if (tag === 'svg') {
        namespaceURI = DOMNamespaces.svg;
      } else if (tag === 'math') {
        namespaceURI = DOMNamespaces.mathml;
      }
      // TODO: Make this a new root container element.
    }

    var ownerDocument = rootContainerElement.ownerDocument;
    var el;
    if (namespaceURI === DOMNamespaces.html) {
      if (tag === 'script') {
        // Create the script via .innerHTML so its "parser-inserted" flag is
        // set to true and it does not execute
        var div = ownerDocument.createElement('div');
        div.innerHTML = `<${tag}></${tag}>`;
        el = div.removeChild(div.firstChild);
      } else if (props.is) {
        el = ownerDocument.createElement(tag, props.is);
      } else {
        // Separate else branch instead of using `props.is || undefined` above becuase of a Firefox bug.
        // See discussion in https://github.com/facebook/react/pull/6896
        // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
        el = ownerDocument.createElement(tag);
      }
    } else {
      el = ownerDocument.createElementNS(
        namespaceURI,
        tag
      );
    }
    var isCustomComponentTag = isCustomComponent(tag, props);
    if (__DEV__) {
      if (isCustomComponentTag && !didWarnShadyDOM && el.shadyRoot) {
        warning(
          false,
          '%s is using shady DOM. Using shady DOM with React can ' +
          'cause things to break subtly.',
          getCurrentOwnerName() || 'A component'
        );
        didWarnShadyDOM = true;
      }
    }
    ReactDOMComponentTree.precacheFiberNode(workInProgress, el);
    updateDOMProperties(
      workInProgress,
      rootContainerElement,
      null,
      props,
      false,
      isCustomComponentTag
    );

    switch (tag) {
      case 'input':
        ReactDOMFiberInput.postMountWrapper(workInProgress, props);
        if (props.autoFocus) {
          focusNode(getNode(workInProgress));
        }
        break;
      case 'textarea':
        ReactDOMFiberTextarea.postMountWrapper(workInProgress, props);
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
        ReactDOMFiberOption.postMountWrapper(workInProgress, props);
        break;
      default:
        if (typeof props.onClick === 'function') {
          trapClickOnNonInteractiveElement(workInProgress);
        }
        break;
    }

    return el;
  },

  receiveComponent: function(
    workInProgress : Fiber,
    rootContainerElement : Element,
    tag : string,
    nextProps : Object,
    context : Object
  ) {
    var lastProps = workInProgress.memoizedProps;

    switch (tag) {
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

    assertValidProps(tag, nextProps);
    var wasCustomComponentTag = isCustomComponent(tag, lastProps);
    var isCustomComponentTag = isCustomComponent(tag, nextProps);
    updateDOMProperties(
      workInProgress,
      rootContainerElement,
      lastProps,
      nextProps,
      wasCustomComponentTag,
      isCustomComponentTag
    );

    switch (tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        ReactDOMFiberInput.updateWrapper(workInProgress, nextProps);
        break;
      case 'textarea':
        ReactDOMFiberTextarea.updateWrapper(workInProgress, nextProps);
        break;
      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        ReactDOMFiberSelect.postUpdateWrapper(workInProgress, nextProps);
        break;
    }
  },

  restoreControlledState: function(finishedWork : Fiber, props : Object) {
    switch (finishedWork.type) {
      case 'input':
        ReactDOMFiberInput.restoreControlledState(finishedWork, props);
        return;
      case 'textarea':
        ReactDOMFiberTextarea.restoreControlledState(finishedWork, props);
        return;
      case 'select':
        ReactDOMFiberSelect.restoreControlledState(finishedWork, props);
        return;
    }
  },

  getPublicInstance: function(fiber : Fiber) {
    // If we add wrappers, this could be something deeper.
    return fiber.stateNode;
  },

};

module.exports = ReactDOMFiberComponent;
