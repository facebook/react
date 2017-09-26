/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactDOMFiberComponent
 * @flow
 */

'use strict';

var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMNamespaces = require('DOMNamespaces');
var DOMProperty = require('DOMProperty');
var DOMPropertyOperations = require('DOMPropertyOperations');
var EventPluginRegistry = require('EventPluginRegistry');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactDOMFiberInput = require('ReactDOMFiberInput');
var ReactDOMFiberOption = require('ReactDOMFiberOption');
var ReactDOMFiberSelect = require('ReactDOMFiberSelect');
var ReactDOMFiberTextarea = require('ReactDOMFiberTextarea');
var {getCurrentFiberOwnerName} = require('ReactDebugCurrentFiber');
var {DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE} = require('HTMLNodeType');

var assertValidProps = require('assertValidProps');
var emptyFunction = require('fbjs/lib/emptyFunction');
var inputValueTracking = require('inputValueTracking');
var isCustomComponent = require('isCustomComponent');
var setInnerHTML = require('setInnerHTML');
var setTextContent = require('setTextContent');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var {getCurrentFiberStackAddendum} = require('ReactDebugCurrentFiber');
  var ReactDOMInvalidARIAHook = require('ReactDOMInvalidARIAHook');
  var ReactDOMNullInputValuePropHook = require('ReactDOMNullInputValuePropHook');
  var ReactDOMUnknownPropertyHook = require('ReactDOMUnknownPropertyHook');
  var {validateProperties: validateARIAProperties} = ReactDOMInvalidARIAHook;
  var {
    validateProperties: validateInputProperties,
  } = ReactDOMNullInputValuePropHook;
  var {
    validateProperties: validateUnknownProperties,
  } = ReactDOMUnknownPropertyHook;
}

var didWarnInvalidHydration = false;
var didWarnShadyDOM = false;

var listenTo = ReactBrowserEventEmitter.listenTo;
var registrationNameModules = EventPluginRegistry.registrationNameModules;

var DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
var SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
var CHILDREN = 'children';
var STYLE = 'style';
var HTML = '__html';

var {Namespaces: {html: HTML_NAMESPACE}, getIntrinsicNamespace} = DOMNamespaces;

if (__DEV__) {
  var warnedUnknownTags = {
    // Chrome is the only major browser not shipping <time>. But as of July
    // 2017 it intends to ship it due to widespread usage. We intentionally
    // *don't* warn for <time> even if it's unrecognized by Chrome because
    // it soon will be, and many apps have been using it anyway.
    time: true,
  };

  var validatePropertiesInDevelopment = function(type, props) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props);
  };

  var warnForTextDifference = function(serverText: string, clientText: string) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    warning(
      false,
      'Text content did not match. Server: "%s" Client: "%s"',
      serverText,
      clientText,
    );
  };

  var warnForPropDifference = function(
    propName: string,
    serverValue: mixed,
    clientValue: mixed,
  ) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    warning(
      false,
      'Prop `%s` did not match. Server: %s Client: %s',
      propName,
      JSON.stringify(serverValue),
      JSON.stringify(clientValue),
    );
  };

  var warnForExtraAttributes = function(attributeNames: Set<string>) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    var names = [];
    attributeNames.forEach(function(name) {
      names.push(name);
    });
    warning(false, 'Extra attributes from the server: %s', names);
  };

  var warnForInvalidEventListener = function(registrationName, listener) {
    warning(
      false,
      'Expected `%s` listener to be a function, instead got a value of `%s` type.%s',
      registrationName,
      typeof listener,
      getCurrentFiberStackAddendum(),
    );
  };

  var testDocument;
  // Parse the HTML and read it back to normalize the HTML string so that it
  // can be used for comparison.
  var normalizeHTML = function(parent: Element, html: string) {
    if (!testDocument) {
      testDocument = document.implementation.createHTMLDocument();
    }
    var testElement = parent.namespaceURI === HTML_NAMESPACE
      ? testDocument.createElement(parent.tagName)
      : testDocument.createElementNS(
          (parent.namespaceURI: any),
          parent.tagName,
        );
    testElement.innerHTML = html;
    return testElement.innerHTML;
  };
}

function ensureListeningTo(rootContainerElement, registrationName) {
  var isDocumentOrFragment =
    rootContainerElement.nodeType === DOCUMENT_NODE ||
    rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
  var doc = isDocumentOrFragment
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
  listenTo(registrationName, doc);
}

function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document,
): Document {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? (rootContainerElement: any)
    : rootContainerElement.ownerDocument;
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

function trapClickOnNonInteractiveElement(node: HTMLElement) {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  node.onclick = emptyFunction;
}

function setInitialDOMProperties(
  domElement: Element,
  rootContainerElement: Element | Document,
  nextProps: Object,
  isCustomComponentTag: boolean,
): void {
  for (var propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    var nextProp = nextProps[propKey];
    if (propKey === STYLE) {
      if (__DEV__) {
        if (nextProp) {
          // Freeze the next style object so that we can assume it won't be
          // mutated. We have already warned for this in the past.
          Object.freeze(nextProp);
        }
      }
      // Relies on `updateStylesByID` not mutating `styleUpdates`.
      CSSPropertyOperations.setValueForStyles(domElement, nextProp);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      var nextHtml = nextProp ? nextProp[HTML] : undefined;
      if (nextHtml != null) {
        setInnerHTML(domElement, nextHtml);
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string') {
        setTextContent(domElement, nextProp);
      } else if (typeof nextProp === 'number') {
        setTextContent(domElement, '' + nextProp);
      }
    } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING) {
      // Noop
    } else if (registrationNameModules.hasOwnProperty(propKey)) {
      if (nextProp != null) {
        if (__DEV__ && typeof nextProp !== 'function') {
          warnForInvalidEventListener(propKey, nextProp);
        }
        ensureListeningTo(rootContainerElement, propKey);
      }
    } else if (isCustomComponentTag) {
      DOMPropertyOperations.setValueForAttribute(domElement, propKey, nextProp);
    } else if (nextProp != null) {
      // If we're updating to null or undefined, we should remove the property
      // from the DOM node instead of inadvertently setting to a string. This
      // brings us in line with the same behavior we have on initial render.
      DOMPropertyOperations.setValueForProperty(domElement, propKey, nextProp);
    }
  }
}

function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean,
): void {
  // TODO: Handle wasCustomComponentTag
  for (var i = 0; i < updatePayload.length; i += 2) {
    var propKey = updatePayload[i];
    var propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      CSSPropertyOperations.setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    } else if (isCustomComponentTag) {
      if (propValue != null) {
        DOMPropertyOperations.setValueForAttribute(
          domElement,
          propKey,
          propValue,
        );
      } else {
        DOMPropertyOperations.deleteValueForAttribute(domElement, propKey);
      }
    } else if (propValue != null) {
      DOMPropertyOperations.setValueForProperty(domElement, propKey, propValue);
    } else {
      // If we're updating to null or undefined, we should remove the property
      // from the DOM node instead of inadvertently setting to a string. This
      // brings us in line with the same behavior we have on initial render.
      DOMPropertyOperations.deleteValueForProperty(domElement, propKey);
    }
  }
}

var ReactDOMFiberComponent = {
  createElement(
    type: *,
    props: Object,
    rootContainerElement: Element | Document,
    parentNamespace: string,
  ): Element {
    // We create tags in the namespace of their parent container, except HTML
    // tags get no namespace.
    var ownerDocument: Document = getOwnerDocumentFromRootContainer(
      rootContainerElement,
    );
    var domElement: Element;
    var namespaceURI = parentNamespace;
    if (namespaceURI === HTML_NAMESPACE) {
      namespaceURI = getIntrinsicNamespace(type);
    }
    if (namespaceURI === HTML_NAMESPACE) {
      if (__DEV__) {
        var isCustomComponentTag = isCustomComponent(type, props);
        // Should this check be gated by parent namespace? Not sure we want to
        // allow <SVG> or <mATH>.
        warning(
          isCustomComponentTag || type === type.toLowerCase(),
          '<%s /> is using uppercase HTML. Always use lowercase HTML tags ' +
            'in React.',
          type,
        );
      }

      if (type === 'script') {
        // Create the script via .innerHTML so its "parser-inserted" flag is
        // set to true and it does not execute
        var div = ownerDocument.createElement('div');
        div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
        // This is guaranteed to yield a script element.
        var firstChild = ((div.firstChild: any): HTMLScriptElement);
        domElement = div.removeChild(firstChild);
      } else if (typeof props.is === 'string') {
        // $FlowIssue `createElement` should be updated for Web Components
        domElement = ownerDocument.createElement(type, {is: props.is});
      } else {
        // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
        // See discussion in https://github.com/facebook/react/pull/6896
        // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
        domElement = ownerDocument.createElement(type);
      }
    } else {
      domElement = ownerDocument.createElementNS(namespaceURI, type);
    }

    if (__DEV__) {
      if (namespaceURI === HTML_NAMESPACE) {
        if (
          !isCustomComponentTag &&
          Object.prototype.toString.call(domElement) ===
            '[object HTMLUnknownElement]' &&
          !Object.prototype.hasOwnProperty.call(warnedUnknownTags, type)
        ) {
          warnedUnknownTags[type] = true;
          warning(
            false,
            'The tag <%s> is unrecognized in this browser. ' +
              'If you meant to render a React component, start its name with ' +
              'an uppercase letter.',
            type,
          );
        }
      }
    }

    return domElement;
  },

  createTextNode(text: string, rootContainerElement: Element | Document): Text {
    return getOwnerDocumentFromRootContainer(
      rootContainerElement,
    ).createTextNode(text);
  },

  setInitialProperties(
    domElement: Element,
    tag: string,
    rawProps: Object,
    rootContainerElement: Element | Document,
  ): void {
    var isCustomComponentTag = isCustomComponent(tag, rawProps);
    if (__DEV__) {
      validatePropertiesInDevelopment(tag, rawProps);
      if (isCustomComponentTag && !didWarnShadyDOM && domElement.shadyRoot) {
        warning(
          false,
          '%s is using shady DOM. Using shady DOM with React can ' +
            'cause things to break subtly.',
          getCurrentFiberOwnerName() || 'A component',
        );
        didWarnShadyDOM = true;
      }
    }

    // TODO: Make sure that we check isMounted before firing any of these events.
    var props: Object;
    switch (tag) {
      case 'iframe':
      case 'object':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topLoad',
          'load',
          domElement,
        );
        props = rawProps;
        break;
      case 'video':
      case 'audio':
        // Create listener for each media event
        for (var event in mediaEvents) {
          if (mediaEvents.hasOwnProperty(event)) {
            ReactBrowserEventEmitter.trapBubbledEvent(
              event,
              mediaEvents[event],
              domElement,
            );
          }
        }
        props = rawProps;
        break;
      case 'source':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topError',
          'error',
          domElement,
        );
        props = rawProps;
        break;
      case 'img':
      case 'image':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topError',
          'error',
          domElement,
        );
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topLoad',
          'load',
          domElement,
        );
        props = rawProps;
        break;
      case 'form':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topReset',
          'reset',
          domElement,
        );
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topSubmit',
          'submit',
          domElement,
        );
        props = rawProps;
        break;
      case 'details':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topToggle',
          'toggle',
          domElement,
        );
        props = rawProps;
        break;
      case 'input':
        ReactDOMFiberInput.initWrapperState(domElement, rawProps);
        props = ReactDOMFiberInput.getHostProps(domElement, rawProps);
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          domElement,
        );
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      case 'option':
        ReactDOMFiberOption.validateProps(domElement, rawProps);
        props = ReactDOMFiberOption.getHostProps(domElement, rawProps);
        break;
      case 'select':
        ReactDOMFiberSelect.initWrapperState(domElement, rawProps);
        props = ReactDOMFiberSelect.getHostProps(domElement, rawProps);
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          domElement,
        );
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      case 'textarea':
        ReactDOMFiberTextarea.initWrapperState(domElement, rawProps);
        props = ReactDOMFiberTextarea.getHostProps(domElement, rawProps);
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          domElement,
        );
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      default:
        props = rawProps;
    }

    assertValidProps(tag, props, getCurrentFiberOwnerName);

    setInitialDOMProperties(
      domElement,
      rootContainerElement,
      props,
      isCustomComponentTag,
    );

    switch (tag) {
      case 'input':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        inputValueTracking.track((domElement: any));
        ReactDOMFiberInput.postMountWrapper(domElement, rawProps);
        break;
      case 'textarea':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        inputValueTracking.track((domElement: any));
        ReactDOMFiberTextarea.postMountWrapper(domElement, rawProps);
        break;
      case 'option':
        ReactDOMFiberOption.postMountWrapper(domElement, rawProps);
        break;
      case 'select':
        ReactDOMFiberSelect.postMountWrapper(domElement, rawProps);
        break;
      default:
        if (typeof props.onClick === 'function') {
          // TODO: This cast may not be sound for SVG, MathML or custom elements.
          trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
        }
        break;
    }
  },

  // Calculate the diff between the two objects.
  diffProperties(
    domElement: Element,
    tag: string,
    lastRawProps: Object,
    nextRawProps: Object,
    rootContainerElement: Element | Document,
  ): null | Array<mixed> {
    if (__DEV__) {
      validatePropertiesInDevelopment(tag, nextRawProps);
    }

    var updatePayload: null | Array<any> = null;

    var lastProps: Object;
    var nextProps: Object;
    switch (tag) {
      case 'input':
        lastProps = ReactDOMFiberInput.getHostProps(domElement, lastRawProps);
        nextProps = ReactDOMFiberInput.getHostProps(domElement, nextRawProps);
        updatePayload = [];
        break;
      case 'option':
        lastProps = ReactDOMFiberOption.getHostProps(domElement, lastRawProps);
        nextProps = ReactDOMFiberOption.getHostProps(domElement, nextRawProps);
        updatePayload = [];
        break;
      case 'select':
        lastProps = ReactDOMFiberSelect.getHostProps(domElement, lastRawProps);
        nextProps = ReactDOMFiberSelect.getHostProps(domElement, nextRawProps);
        updatePayload = [];
        break;
      case 'textarea':
        lastProps = ReactDOMFiberTextarea.getHostProps(
          domElement,
          lastRawProps,
        );
        nextProps = ReactDOMFiberTextarea.getHostProps(
          domElement,
          nextRawProps,
        );
        updatePayload = [];
        break;
      default:
        lastProps = lastRawProps;
        nextProps = nextRawProps;
        if (
          typeof lastProps.onClick !== 'function' &&
          typeof nextProps.onClick === 'function'
        ) {
          // TODO: This cast may not be sound for SVG, MathML or custom elements.
          trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
        }
        break;
    }

    assertValidProps(tag, nextProps, getCurrentFiberOwnerName);

    var propKey;
    var styleName;
    var styleUpdates = null;
    for (propKey in lastProps) {
      if (
        nextProps.hasOwnProperty(propKey) ||
        !lastProps.hasOwnProperty(propKey) ||
        lastProps[propKey] == null
      ) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = '';
          }
        }
      } else if (
        propKey === DANGEROUSLY_SET_INNER_HTML ||
        propKey === CHILDREN
      ) {
        // Noop. This is handled by the clear text mechanism.
      } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING) {
        // Noop
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" fiber pointer gets updated so we need a commit
        // to update this element.
        if (!updatePayload) {
          updatePayload = [];
        }
      } else {
        // For all other deleted properties we add it to the queue. We use
        // the whitelist in the commit phase instead.
        (updatePayload = updatePayload || []).push(propKey, null);
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps != null ? lastProps[propKey] : undefined;
      if (
        !nextProps.hasOwnProperty(propKey) ||
        nextProp === lastProp ||
        (nextProp == null && lastProp == null)
      ) {
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
            if (
              lastProp.hasOwnProperty(styleName) &&
              (!nextProp || !nextProp.hasOwnProperty(styleName))
            ) {
              if (!styleUpdates) {
                styleUpdates = {};
              }
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (
              nextProp.hasOwnProperty(styleName) &&
              lastProp[styleName] !== nextProp[styleName]
            ) {
              if (!styleUpdates) {
                styleUpdates = {};
              }
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          if (!styleUpdates) {
            if (!updatePayload) {
              updatePayload = [];
            }
            updatePayload.push(propKey, styleUpdates);
          }
          styleUpdates = nextProp;
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        var nextHtml = nextProp ? nextProp[HTML] : undefined;
        var lastHtml = lastProp ? lastProp[HTML] : undefined;
        if (nextHtml != null) {
          if (lastHtml !== nextHtml) {
            (updatePayload = updatePayload || []).push(propKey, '' + nextHtml);
          }
        } else {
          // TODO: It might be too late to clear this if we have children
          // inserted already.
        }
      } else if (propKey === CHILDREN) {
        if (
          lastProp !== nextProp &&
          (typeof nextProp === 'string' || typeof nextProp === 'number')
        ) {
          (updatePayload = updatePayload || []).push(propKey, '' + nextProp);
        }
      } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING) {
        // Noop
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp != null) {
          // We eagerly listen to this even though we haven't committed yet.
          if (__DEV__ && typeof nextProp !== 'function') {
            warnForInvalidEventListener(propKey, nextProp);
          }
          ensureListeningTo(rootContainerElement, propKey);
        }
        if (!updatePayload && lastProp !== nextProp) {
          // This is a special case. If any listener updates we need to ensure
          // that the "current" props pointer gets updated so we need a commit
          // to update this element.
          updatePayload = [];
        }
      } else {
        // For any other property we always add it to the queue and then we
        // filter it out using the whitelist during the commit.
        (updatePayload = updatePayload || []).push(propKey, nextProp);
      }
    }
    if (styleUpdates) {
      (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
    }
    return updatePayload;
  },

  // Apply the diff.
  updateProperties(
    domElement: Element,
    updatePayload: Array<any>,
    tag: string,
    lastRawProps: Object,
    nextRawProps: Object,
  ): void {
    var wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
    var isCustomComponentTag = isCustomComponent(tag, nextRawProps);
    // Apply the diff.
    updateDOMProperties(
      domElement,
      updatePayload,
      wasCustomComponentTag,
      isCustomComponentTag,
    );

    // TODO: Ensure that an update gets scheduled if any of the special props
    // changed.
    switch (tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        ReactDOMFiberInput.updateWrapper(domElement, nextRawProps);

        // We also check that we haven't missed a value update, such as a
        // Radio group shifting the checked value to another named radio input.
        inputValueTracking.updateValueIfChanged((domElement: any));
        break;
      case 'textarea':
        ReactDOMFiberTextarea.updateWrapper(domElement, nextRawProps);
        break;
      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        ReactDOMFiberSelect.postUpdateWrapper(domElement, nextRawProps);
        break;
    }
  },

  diffHydratedProperties(
    domElement: Element,
    tag: string,
    rawProps: Object,
    parentNamespace: string,
    rootContainerElement: Element | Document,
  ): null | Array<mixed> {
    if (__DEV__) {
      var isCustomComponentTag = isCustomComponent(tag, rawProps);
      validatePropertiesInDevelopment(tag, rawProps);
      if (isCustomComponentTag && !didWarnShadyDOM && domElement.shadyRoot) {
        warning(
          false,
          '%s is using shady DOM. Using shady DOM with React can ' +
            'cause things to break subtly.',
          getCurrentFiberOwnerName() || 'A component',
        );
        didWarnShadyDOM = true;
      }
    }

    // TODO: Make sure that we check isMounted before firing any of these events.
    switch (tag) {
      case 'iframe':
      case 'object':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topLoad',
          'load',
          domElement,
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
              domElement,
            );
          }
        }
        break;
      case 'source':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topError',
          'error',
          domElement,
        );
        break;
      case 'img':
      case 'image':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topError',
          'error',
          domElement,
        );
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topLoad',
          'load',
          domElement,
        );
        break;
      case 'form':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topReset',
          'reset',
          domElement,
        );
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topSubmit',
          'submit',
          domElement,
        );
        break;
      case 'details':
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topToggle',
          'toggle',
          domElement,
        );
        break;
      case 'input':
        ReactDOMFiberInput.initWrapperState(domElement, rawProps);
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          domElement,
        );
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      case 'option':
        ReactDOMFiberOption.validateProps(domElement, rawProps);
        break;
      case 'select':
        ReactDOMFiberSelect.initWrapperState(domElement, rawProps);
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          domElement,
        );
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
      case 'textarea':
        ReactDOMFiberTextarea.initWrapperState(domElement, rawProps);
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          domElement,
        );
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(rootContainerElement, 'onChange');
        break;
    }

    assertValidProps(tag, rawProps, getCurrentFiberOwnerName);

    if (__DEV__) {
      var extraAttributeNames: Set<string> = new Set();
      var attributes = domElement.attributes;
      for (var i = 0; i < attributes.length; i++) {
        var name = attributes[i].name.toLowerCase();
        switch (name) {
          // Built-in SSR attribute is whitelisted
          case 'data-reactroot':
            break;
          // Controlled attributes are not validated
          // TODO: Only ignore them on controlled tags.
          case 'value':
            break;
          case 'checked':
            break;
          case 'selected':
            break;
          default:
            // Intentionally use the original name.
            // See discussion in https://github.com/facebook/react/pull/10676.
            extraAttributeNames.add(attributes[i].name);
        }
      }
    }

    var updatePayload = null;
    for (var propKey in rawProps) {
      if (!rawProps.hasOwnProperty(propKey)) {
        continue;
      }
      var nextProp = rawProps[propKey];
      if (propKey === CHILDREN) {
        // For text content children we compare against textContent. This
        // might match additional HTML that is hidden when we read it using
        // textContent. E.g. "foo" will match "f<span>oo</span>" but that still
        // satisfies our requirement. Our requirement is not to produce perfect
        // HTML and attributes. Ideally we should preserve structure but it's
        // ok not to if the visible content is still enough to indicate what
        // even listeners these nodes might be wired up to.
        // TODO: Warn if there is more than a single textNode as a child.
        // TODO: Should we use domElement.firstChild.nodeValue to compare?
        if (typeof nextProp === 'string') {
          if (domElement.textContent !== nextProp) {
            if (__DEV__) {
              warnForTextDifference(domElement.textContent, nextProp);
            }
            updatePayload = [CHILDREN, nextProp];
          }
        } else if (typeof nextProp === 'number') {
          if (domElement.textContent !== '' + nextProp) {
            if (__DEV__) {
              warnForTextDifference(domElement.textContent, nextProp);
            }
            updatePayload = [CHILDREN, '' + nextProp];
          }
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp != null) {
          if (__DEV__ && typeof nextProp !== 'function') {
            warnForInvalidEventListener(propKey, nextProp);
          }
          ensureListeningTo(rootContainerElement, propKey);
        }
      } else if (__DEV__) {
        // Validate that the properties correspond to their expected values.
        var serverValue;
        var propertyInfo;
        if (
          propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
          // Controlled attributes are not validated
          // TODO: Only ignore them on controlled tags.
          propKey === 'value' ||
          propKey === 'checked' ||
          propKey === 'selected'
        ) {
          // Noop
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
          const rawHtml = nextProp ? nextProp[HTML] || '' : '';
          const serverHTML = domElement.innerHTML;
          const expectedHTML = normalizeHTML(domElement, rawHtml);
          if (expectedHTML !== serverHTML) {
            warnForPropDifference(propKey, serverHTML, expectedHTML);
          }
        } else if (propKey === STYLE) {
          // $FlowFixMe - Should be inferred as not undefined.
          extraAttributeNames.delete(propKey);
          const expectedStyle = CSSPropertyOperations.createDangerousStringForStyles(
            nextProp,
          );
          serverValue = domElement.getAttribute('style');
          if (expectedStyle !== serverValue) {
            warnForPropDifference(propKey, serverValue, expectedStyle);
          }
        } else if (isCustomComponentTag) {
          // $FlowFixMe - Should be inferred as not undefined.
          extraAttributeNames.delete(propKey.toLowerCase());
          serverValue = DOMPropertyOperations.getValueForAttribute(
            domElement,
            propKey,
            nextProp,
          );

          if (nextProp !== serverValue) {
            warnForPropDifference(propKey, serverValue, nextProp);
          }
        } else if (DOMProperty.shouldSetAttribute(propKey, nextProp)) {
          if ((propertyInfo = DOMProperty.getPropertyInfo(propKey))) {
            // $FlowFixMe - Should be inferred as not undefined.
            extraAttributeNames.delete(propertyInfo.attributeName);
            serverValue = DOMPropertyOperations.getValueForProperty(
              domElement,
              propKey,
              nextProp,
            );
          } else {
            let ownNamespace = parentNamespace;
            if (ownNamespace === HTML_NAMESPACE) {
              ownNamespace = getIntrinsicNamespace(tag);
            }
            if (ownNamespace === HTML_NAMESPACE) {
              // $FlowFixMe - Should be inferred as not undefined.
              extraAttributeNames.delete(propKey.toLowerCase());
            } else {
              // $FlowFixMe - Should be inferred as not undefined.
              extraAttributeNames.delete(propKey);
            }
            serverValue = DOMPropertyOperations.getValueForAttribute(
              domElement,
              propKey,
              nextProp,
            );
          }

          if (nextProp !== serverValue) {
            warnForPropDifference(propKey, serverValue, nextProp);
          }
        }
      }
    }

    if (__DEV__) {
      // $FlowFixMe - Should be inferred as not undefined.
      if (extraAttributeNames.size > 0) {
        // $FlowFixMe - Should be inferred as not undefined.
        warnForExtraAttributes(extraAttributeNames);
      }
    }

    switch (tag) {
      case 'input':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        inputValueTracking.track((domElement: any));
        ReactDOMFiberInput.postMountWrapper(domElement, rawProps);
        break;
      case 'textarea':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        inputValueTracking.track((domElement: any));
        ReactDOMFiberTextarea.postMountWrapper(domElement, rawProps);
        break;
      case 'select':
      case 'option':
        // For input and textarea we current always set the value property at
        // post mount to force it to diverge from attributes. However, for
        // option and select we don't quite do the same thing and select
        // is not resilient to the DOM state changing so we don't do that here.
        // TODO: Consider not doing this for input and textarea.
        break;
      default:
        if (typeof rawProps.onClick === 'function') {
          // TODO: This cast may not be sound for SVG, MathML or custom elements.
          trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
        }
        break;
    }

    return updatePayload;
  },

  diffHydratedText(textNode: Text, text: string): boolean {
    const isDifferent = textNode.nodeValue !== text;
    if (__DEV__) {
      if (isDifferent) {
        warnForTextDifference(textNode.nodeValue, text);
      }
    }
    return isDifferent;
  },

  warnForDeletedHydratableElement(
    parentNode: Element | Document,
    child: Element,
  ) {
    if (__DEV__) {
      if (didWarnInvalidHydration) {
        return;
      }
      didWarnInvalidHydration = true;
      warning(
        false,
        'Did not expect server HTML to contain a <%s> in <%s>.',
        child.nodeName.toLowerCase(),
        parentNode.nodeName.toLowerCase(),
      );
    }
  },

  warnForDeletedHydratableText(parentNode: Element | Document, child: Text) {
    if (__DEV__) {
      if (didWarnInvalidHydration) {
        return;
      }
      didWarnInvalidHydration = true;
      warning(
        false,
        'Did not expect server HTML to contain the text node "%s" in <%s>.',
        child.nodeValue,
        parentNode.nodeName.toLowerCase(),
      );
    }
  },

  warnForInsertedHydratedElement(
    parentNode: Element | Document,
    tag: string,
    props: Object,
  ) {
    if (__DEV__) {
      if (didWarnInvalidHydration) {
        return;
      }
      didWarnInvalidHydration = true;
      warning(
        false,
        'Expected server HTML to contain a matching <%s> in <%s>.',
        tag,
        parentNode.nodeName.toLowerCase(),
      );
    }
  },

  warnForInsertedHydratedText(parentNode: Element | Document, text: string) {
    if (__DEV__) {
      if (text === '') {
        // We expect to insert empty text nodes since they're not represented in
        // the HTML.
        // TODO: Remove this special case if we can just avoid inserting empty
        // text nodes.
        return;
      }
      if (didWarnInvalidHydration) {
        return;
      }
      didWarnInvalidHydration = true;
      warning(
        false,
        'Expected server HTML to contain a matching text node for "%s" in <%s>.',
        text,
        parentNode.nodeName.toLowerCase(),
      );
    }
  },

  restoreControlledState(
    domElement: Element,
    tag: string,
    props: Object,
  ): void {
    switch (tag) {
      case 'input':
        ReactDOMFiberInput.restoreControlledState(domElement, props);
        return;
      case 'textarea':
        ReactDOMFiberTextarea.restoreControlledState(domElement, props);
        return;
      case 'select':
        ReactDOMFiberSelect.restoreControlledState(domElement, props);
        return;
    }
  },
};

module.exports = ReactDOMFiberComponent;
