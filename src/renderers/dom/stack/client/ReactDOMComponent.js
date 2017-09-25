/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMComponent
 */

'use strict';

var AutoFocusUtils = require('AutoFocusUtils');
var CSSPropertyOperations = require('CSSPropertyOperations');
var DOMLazyTree = require('DOMLazyTree');
var Namespaces = require('DOMNamespaces').Namespaces;
var DOMMarkupOperations = require('DOMMarkupOperations');
var DOMProperty = require('DOMProperty');
var DOMPropertyOperations = require('DOMPropertyOperations');
var EventPluginRegistry = require('EventPluginRegistry');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactDOMComponentFlags = require('ReactDOMComponentFlags');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMInput = require('ReactDOMInput');
var ReactDOMOption = require('ReactDOMOption');
var ReactDOMSelect = require('ReactDOMSelect');
var ReactDOMTextarea = require('ReactDOMTextarea');
var ReactInstrumentation = require('ReactInstrumentation');
var ReactMultiChild = require('ReactMultiChild');
var ReactServerRenderingTransaction = require('ReactServerRenderingTransaction');
var {DOCUMENT_FRAGMENT_NODE} = require('HTMLNodeType');

var dangerousStyleValue = require('dangerousStyleValue');
var emptyFunction = require('fbjs/lib/emptyFunction');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var hyphenateStyleName = require('fbjs/lib/hyphenateStyleName');
var inputValueTracking = require('inputValueTracking');
var invariant = require('fbjs/lib/invariant');
var isCustomComponent = require('isCustomComponent');
var memoizeStringOnly = require('fbjs/lib/memoizeStringOnly');
var omittedCloseTags = require('omittedCloseTags');
var validateDOMNesting = require('validateDOMNesting');
var voidElementTags = require('voidElementTags');
var warnValidStyle = require('warnValidStyle');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

var didWarnShadyDOM = false;

var Flags = ReactDOMComponentFlags;
var getNode = ReactDOMComponentTree.getNodeFromInstance;
var listenTo = ReactBrowserEventEmitter.listenTo;
var registrationNameModules = EventPluginRegistry.registrationNameModules;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {string: true, number: true};

var STYLE = 'style';
var HTML = '__html';

function getDeclarationErrorAddendum(internalInstance) {
  if (internalInstance) {
    var owner = internalInstance._currentElement._owner || null;
    if (owner) {
      var name = owner.getName();
      if (name) {
        return '\n\nThis DOM node was rendered by `' + name + '`.';
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
      getDeclarationErrorAddendum(component),
    );
  }
  if (props.dangerouslySetInnerHTML != null) {
    invariant(
      props.children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
    );
    invariant(
      typeof props.dangerouslySetInnerHTML === 'object' &&
        HTML in props.dangerouslySetInnerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://fb.me/react-invariant-dangerously-set-inner-html ' +
        'for more information.',
    );
  }
  if (__DEV__) {
    warning(
      props.suppressContentEditableWarning ||
        !props.contentEditable ||
        props.children == null,
      'A component is `contentEditable` and contains `children` managed by ' +
        'React. It is now your responsibility to guarantee that none of ' +
        'those nodes are unexpectedly modified or duplicated. This is ' +
        'probably not intentional.',
    );
  }
  invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
      "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
      'using JSX.%s',
    getDeclarationErrorAddendum(component),
  );
}

function ensureListeningTo(inst, registrationName, transaction) {
  if (transaction instanceof ReactServerRenderingTransaction) {
    return;
  }
  var containerInfo = inst._hostContainerInfo;
  var isDocumentFragment =
    containerInfo._node &&
    containerInfo._node.nodeType === DOCUMENT_FRAGMENT_NODE;
  var doc = isDocumentFragment
    ? containerInfo._node
    : containerInfo._ownerDocument;
  listenTo(registrationName, doc);
}

function inputPostMount() {
  var inst = this;
  ReactDOMInput.postMountWrapper(inst);
}

function textareaPostMount() {
  var inst = this;
  ReactDOMTextarea.postMountWrapper(inst);
}

function optionPostMount() {
  var inst = this;
  ReactDOMOption.postMountWrapper(inst);
}

var processStyleName = memoizeStringOnly(function(styleName) {
  return hyphenateStyleName(styleName);
});

function createMarkupForStyles(styles, component) {
  var serialized = '';
  var delimiter = '';
  for (var styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    var isCustomProperty = styleName.indexOf('--') === 0;
    var styleValue = styles[styleName];
    if (__DEV__) {
      if (!isCustomProperty) {
        warnValidStyle(styleName, styleValue, component);
      }
    }
    if (styleValue != null) {
      serialized += delimiter + processStyleName(styleName) + ':';
      serialized += dangerousStyleValue(
        styleName,
        styleValue,
        isCustomProperty,
      );

      delimiter = ';';
    }
  }
  return serialized || null;
}

var setAndValidateContentChildDev = emptyFunction;
if (__DEV__) {
  setAndValidateContentChildDev = function(content) {
    var hasExistingContent = this._contentDebugID != null;
    var debugID = this._debugID;
    // This ID represents the inlined child that has no backing instance:
    var contentDebugID = -debugID;

    if (content == null) {
      if (hasExistingContent) {
        ReactInstrumentation.debugTool.onUnmountComponent(this._contentDebugID);
      }
      this._contentDebugID = null;
      return;
    }

    validateDOMNesting(null, '' + content, this, this._ancestorInfo);
    this._contentDebugID = contentDebugID;
    if (hasExistingContent) {
      ReactInstrumentation.debugTool.onBeforeUpdateComponent(
        contentDebugID,
        content,
      );
      ReactInstrumentation.debugTool.onUpdateComponent(contentDebugID);
    } else {
      ReactInstrumentation.debugTool.onBeforeMountComponent(
        contentDebugID,
        content,
        debugID,
      );
      ReactInstrumentation.debugTool.onMountComponent(contentDebugID);
      ReactInstrumentation.debugTool.onSetChildren(debugID, [contentDebugID]);
    }
  };
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

function trackInputValue() {
  inputValueTracking.track(getNode(this));
}

function trapClickOnNonInteractiveElement() {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  var node = getNode(this);
  node.onclick = emptyFunction;
}

function trapBubbledEventsLocal() {
  var inst = this;
  // If a component renders to null or if another component fatals and causes
  // the state of the tree to be corrupted, `node` here can be null.
  invariant(inst._rootNodeID, 'Must be mounted to trap events');
  var node = getNode(inst);
  invariant(node, 'trapBubbledEvent(...): Requires node to be rendered.');

  switch (inst._tag) {
    case 'iframe':
    case 'object':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent('topLoad', 'load', node),
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
              node,
            ),
          );
        }
      }
      break;
    case 'source':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent('topError', 'error', node),
      ];
      break;
    case 'img':
    case 'image':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent('topError', 'error', node),
        ReactBrowserEventEmitter.trapBubbledEvent('topLoad', 'load', node),
      ];
      break;
    case 'form':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent('topReset', 'reset', node),
        ReactBrowserEventEmitter.trapBubbledEvent('topSubmit', 'submit', node),
      ];
      break;
    case 'input':
    case 'select':
    case 'textarea':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent(
          'topInvalid',
          'invalid',
          node,
        ),
      ];
      break;
    case 'details':
      inst._wrapperState.listeners = [
        ReactBrowserEventEmitter.trapBubbledEvent('topToggle', 'toggle', node),
      ];
      break;
  }
}

function postUpdateSelectWrapper() {
  ReactDOMSelect.postUpdateWrapper(this);
}

var newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true,
};

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name

var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
var validatedTagCache = {};

function validateDangerousTag(tag) {
  if (!validatedTagCache.hasOwnProperty(tag)) {
    invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag);
    validatedTagCache[tag] = true;
  }
}

var globalIdCounter = 1;
var warnedUnknownTags = {
  // Chrome is the only major browser not shipping <time>. But as of July
  // 2017 it intends to ship it due to widespread usage. We intentionally
  // *don't* warn for <time> even if it's unrecognized by Chrome because
  // it soon will be, and many apps have been using it anyway.
  time: true,
};

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @constructor ReactDOMComponent
 * @extends ReactMultiChild
 */
function ReactDOMComponent(element) {
  var tag = element.type;
  this._currentElement = element;
  this._tag = tag.toLowerCase();
  this._namespaceURI = null;
  this._renderedChildren = null;
  this._hostNode = null;
  this._hostParent = null;
  this._rootNodeID = 0;
  this._domID = 0;
  this._hostContainerInfo = null;
  this._wrapperState = null;
  this._topLevelWrapper = null;
  this._flags = 0;
  if (__DEV__) {
    this._ancestorInfo = null;
    setAndValidateContentChildDev.call(this, null);
  }
}

ReactDOMComponent.displayName = 'ReactDOMComponent';

ReactDOMComponent.Mixin = {
  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?ReactDOMComponent} the parent component instance
   * @param {?object} info about the host container
   * @param {object} context
   * @return {string} The computed markup.
   */
  mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context,
  ) {
    this._rootNodeID = globalIdCounter++;
    this._domID = hostContainerInfo._idCounter++;
    this._hostParent = hostParent;
    this._hostContainerInfo = hostContainerInfo;

    var props = this._currentElement.props;

    switch (this._tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'image':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
      case 'details':
        this._wrapperState = {
          listeners: null,
        };
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        break;
      case 'input':
        ReactDOMInput.mountWrapper(this, props, hostParent);
        props = ReactDOMInput.getHostProps(this, props);
        transaction.getReactMountReady().enqueue(trackInputValue, this);
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(this, 'onChange', transaction);
        break;
      case 'option':
        ReactDOMOption.mountWrapper(this, props, hostParent);
        props = ReactDOMOption.getHostProps(this, props);
        break;
      case 'select':
        ReactDOMSelect.mountWrapper(this, props, hostParent);
        props = ReactDOMSelect.getHostProps(this, props);
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(this, 'onChange', transaction);
        break;
      case 'textarea':
        ReactDOMTextarea.mountWrapper(this, props, hostParent);
        props = ReactDOMTextarea.getHostProps(this, props);
        transaction.getReactMountReady().enqueue(trackInputValue, this);
        transaction.getReactMountReady().enqueue(trapBubbledEventsLocal, this);
        // For controlled components we always need to ensure we're listening
        // to onChange. Even if there is no listener.
        ensureListeningTo(this, 'onChange', transaction);
        break;
    }

    assertValidProps(this, props);

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
    if (
      namespaceURI == null ||
      (namespaceURI === Namespaces.svg && parentTag === 'foreignobject')
    ) {
      namespaceURI = Namespaces.html;
    }
    if (__DEV__) {
      var isCustomComponentTag = isCustomComponent(this._tag, props);
    }
    if (namespaceURI === Namespaces.html) {
      if (__DEV__) {
        warning(
          isCustomComponentTag || this._tag === this._currentElement.type,
          '<%s /> is using uppercase HTML. Always use lowercase HTML tags ' +
            'in React.',
          this._currentElement.type,
        );
      }
      if (this._tag === 'svg') {
        namespaceURI = Namespaces.svg;
      } else if (this._tag === 'math') {
        namespaceURI = Namespaces.mathml;
      }
    }
    this._namespaceURI = namespaceURI;

    if (__DEV__) {
      var parentInfo;
      if (hostParent != null) {
        parentInfo = hostParent._ancestorInfo;
      } else if (hostContainerInfo._tag) {
        parentInfo = hostContainerInfo._ancestorInfo;
      }
      if (parentInfo) {
        // parentInfo should always be present except for the top-level
        // component when server rendering
        validateDOMNesting(this._tag, null, this, parentInfo);
      }
      this._ancestorInfo = validateDOMNesting.updatedAncestorInfo(
        parentInfo,
        this._tag,
        this,
      );
    }

    var mountImage;
    var type = this._currentElement.type;
    if (transaction.useCreateElement) {
      var ownerDocument = hostContainerInfo._ownerDocument;
      var el;
      if (namespaceURI === Namespaces.html) {
        if (this._tag === 'script') {
          // Create the script via .innerHTML so its "parser-inserted" flag is
          // set to true and it does not execute
          var div = ownerDocument.createElement('div');
          div.innerHTML = `<${type}></${type}>`;
          el = div.removeChild(div.firstChild);
        } else if (typeof props.is === 'string') {
          el = ownerDocument.createElement(type, {is: props.is});
        } else {
          // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
          // See discussion in https://github.com/facebook/react/pull/6896
          // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
          el = ownerDocument.createElement(type);
        }
      } else {
        el = ownerDocument.createElementNS(namespaceURI, type);
      }
      if (__DEV__) {
        if (isCustomComponentTag && !didWarnShadyDOM && el.shadyRoot) {
          var owner = this._currentElement._owner;
          var name = (owner && owner.getName()) || 'A component';
          warning(
            false,
            '%s is using shady DOM. Using shady DOM with React can ' +
              'cause things to break subtly.',
            name,
          );
          didWarnShadyDOM = true;
        }
        if (this._namespaceURI === Namespaces.html) {
          if (
            !isCustomComponentTag &&
            Object.prototype.toString.call(el) ===
              '[object HTMLUnknownElement]' &&
            !Object.prototype.hasOwnProperty.call(warnedUnknownTags, this._tag)
          ) {
            warnedUnknownTags[this._tag] = true;
            warning(
              false,
              'The tag <%s> is unrecognized in this browser. ' +
                'If you meant to render a React component, start its name with ' +
                'an uppercase letter.',
              this._tag,
            );
          }
        }
      }
      ReactDOMComponentTree.precacheNode(this, el);
      this._flags |= Flags.hasCachedChildNodes;
      if (!this._hostParent) {
        DOMPropertyOperations.setAttributeForRoot(el);
      }
      this._updateDOMProperties(null, props, transaction, isCustomComponentTag);
      var lazyTree = DOMLazyTree(el);
      this._createInitialChildren(transaction, props, context, lazyTree);
      mountImage = lazyTree;
    } else {
      validateDangerousTag(this._tag);
      var tagOpen = this._createOpenTagMarkupAndPutListeners(
        transaction,
        props,
      );
      var tagContent = this._createContentMarkup(transaction, props, context);
      if (!tagContent && omittedCloseTags[this._tag]) {
        mountImage = tagOpen + '/>';
      } else {
        mountImage = tagOpen + '>' + tagContent + '</' + type + '>';
      }
    }

    switch (this._tag) {
      case 'input':
        transaction.getReactMountReady().enqueue(inputPostMount, this);
        if (props.autoFocus) {
          transaction
            .getReactMountReady()
            .enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'textarea':
        transaction.getReactMountReady().enqueue(textareaPostMount, this);
        if (props.autoFocus) {
          transaction
            .getReactMountReady()
            .enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'select':
        if (props.autoFocus) {
          transaction
            .getReactMountReady()
            .enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'button':
        if (props.autoFocus) {
          transaction
            .getReactMountReady()
            .enqueue(AutoFocusUtils.focusDOMComponent, this);
        }
        break;
      case 'option':
        transaction.getReactMountReady().enqueue(optionPostMount, this);
        break;
      default:
        if (typeof props.onClick === 'function') {
          transaction
            .getReactMountReady()
            .enqueue(trapClickOnNonInteractiveElement, this);
        }
        break;
    }

    return mountImage;
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
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} props
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkupAndPutListeners: function(transaction, props) {
    var ret = '<' + this._currentElement.type;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNameModules.hasOwnProperty(propKey)) {
        if (propValue) {
          ensureListeningTo(this, propKey, transaction);
        }
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            if (__DEV__) {
              Object.freeze(propValue);
            }
          }
          propValue = createMarkupForStyles(propValue, this);
        }
        var markup = null;
        if (this._tag != null && isCustomComponent(this._tag, props)) {
          if (!DOMProperty.isReservedProp(propKey)) {
            markup = DOMMarkupOperations.createMarkupForCustomAttribute(
              propKey,
              propValue,
            );
          }
        } else {
          markup = DOMMarkupOperations.createMarkupForProperty(
            propKey,
            propValue,
          );
        }
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    // For static pages, no need to put React ID and checksum. Saves lots of
    // bytes.
    if (transaction.renderToStaticMarkup) {
      return ret;
    }

    if (!this._hostParent) {
      ret += ' ' + DOMMarkupOperations.createMarkupForRoot();
    }
    ret += ' ' + DOMMarkupOperations.createMarkupForID(this._domID);
    return ret;
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} props
   * @param {object} context
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction, props, context) {
    var ret = '';

    // Intentional use of != to avoid catching zero/false.
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        ret = innerHTML.__html;
      }
    } else {
      var contentToUse = CONTENT_TYPES[typeof props.children]
        ? props.children
        : null;
      var childrenToUse = contentToUse != null ? null : props.children;
      if (contentToUse != null) {
        // TODO: Validate that text is allowed as a child of this node
        ret = escapeTextContentForBrowser(contentToUse);
        if (__DEV__) {
          setAndValidateContentChildDev.call(this, contentToUse);
        }
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction,
          context,
        );
        ret = mountImages.join('');
      }
    }
    if (newlineEatingTags[this._tag] && ret.charAt(0) === '\n') {
      // text/html ignores the first character in these tags if it's a newline
      // Prefer to break application/xml over text/html (for now) by adding
      // a newline specifically to get eaten by the parser. (Alternately for
      // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
      // \r is normalized out by HTMLTextAreaElement#value.)
      // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
      // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
      // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
      // See: Parsing of "textarea" "listing" and "pre" elements
      //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
      return '\n' + ret;
    } else {
      return ret;
    }
  },

  _createInitialChildren: function(transaction, props, context, lazyTree) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      const innerHTMLContent = innerHTML.__html;
      if (innerHTMLContent != null && innerHTMLContent !== '') {
        DOMLazyTree.queueHTML(lazyTree, innerHTMLContent);
      }
    } else {
      var contentToUse = CONTENT_TYPES[typeof props.children]
        ? props.children
        : null;
      var childrenToUse = contentToUse != null ? null : props.children;
      // TODO: Validate that text is allowed as a child of this node
      if (contentToUse != null) {
        // Avoid setting textContent when the text is empty. In IE11 setting
        // textContent on a text area will cause the placeholder to not
        // show within the textarea until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        if (contentToUse !== '') {
          if (__DEV__) {
            setAndValidateContentChildDev.call(this, contentToUse);
          }
          DOMLazyTree.queueText(lazyTree, contentToUse);
        }
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction,
          context,
        );
        for (var i = 0; i < mountImages.length; i++) {
          DOMLazyTree.queueChild(lazyTree, mountImages[i]);
        }
      }
    }
  },

  /**
   * Receives a next element and updates the component.
   *
   * @internal
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {object} context
   */
  receiveComponent: function(nextElement, transaction, context) {
    var prevElement = this._currentElement;
    this._currentElement = nextElement;
    this.updateComponent(transaction, prevElement, nextElement, context);
  },

  /**
   * Updates a DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevElement
   * @param {ReactElement} nextElement
   * @internal
   * @overridable
   */
  updateComponent: function(transaction, prevElement, nextElement, context) {
    var lastProps = prevElement.props;
    var nextProps = this._currentElement.props;

    switch (this._tag) {
      case 'input':
        lastProps = ReactDOMInput.getHostProps(this, lastProps);
        nextProps = ReactDOMInput.getHostProps(this, nextProps);
        break;
      case 'option':
        lastProps = ReactDOMOption.getHostProps(this, lastProps);
        nextProps = ReactDOMOption.getHostProps(this, nextProps);
        break;
      case 'select':
        lastProps = ReactDOMSelect.getHostProps(this, lastProps);
        nextProps = ReactDOMSelect.getHostProps(this, nextProps);
        break;
      case 'textarea':
        lastProps = ReactDOMTextarea.getHostProps(this, lastProps);
        nextProps = ReactDOMTextarea.getHostProps(this, nextProps);
        break;
      default:
        if (
          typeof lastProps.onClick !== 'function' &&
          typeof nextProps.onClick === 'function'
        ) {
          transaction
            .getReactMountReady()
            .enqueue(trapClickOnNonInteractiveElement, this);
        }
        break;
    }

    assertValidProps(this, nextProps);
    var isCustomComponentTag = isCustomComponent(this._tag, nextProps);
    this._updateDOMProperties(
      lastProps,
      nextProps,
      transaction,
      isCustomComponentTag,
    );
    this._updateDOMChildren(lastProps, nextProps, transaction, context);

    switch (this._tag) {
      case 'input':
        // Update the wrapper around inputs *after* updating props. This has to
        // happen after `_updateDOMProperties`. Otherwise HTML5 input validations
        // raise warnings and prevent the new value from being assigned.
        ReactDOMInput.updateWrapper(this);
        // We also check that we haven't missed a value update, such as a
        // Radio group shifting the checked value to another named radio input.
        inputValueTracking.updateValueIfChanged(getNode(this));
        break;
      case 'textarea':
        ReactDOMTextarea.updateWrapper(this);
        break;
      case 'select':
        // <select> value update needs to occur after <option> children
        // reconciliation
        transaction.getReactMountReady().enqueue(postUpdateSelectWrapper, this);
        break;
    }
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
   * @param {object} lastProps
   * @param {object} nextProps
   * @param {?DOMElement} node
   */
  _updateDOMProperties: function(
    lastProps,
    nextProps,
    transaction,
    isCustomComponentTag,
  ) {
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (
        nextProps.hasOwnProperty(propKey) ||
        !lastProps.hasOwnProperty(propKey) ||
        lastProps[propKey] == null
      ) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = lastProps[STYLE];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        // Do nothing for event names.
      } else if (!DOMProperty.isReservedProp(propKey)) {
        if (isCustomComponent(this._tag, lastProps)) {
          DOMPropertyOperations.deleteValueForAttribute(getNode(this), propKey);
        } else {
          DOMPropertyOperations.deleteValueForProperty(getNode(this), propKey);
        }
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
        if (nextProp) {
          if (__DEV__) {
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
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (
              nextProp.hasOwnProperty(styleName) &&
              lastProp[styleName] !== nextProp[styleName]
            ) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp) {
          ensureListeningTo(this, propKey, transaction);
        }
      } else if (isCustomComponentTag) {
        if (!DOMProperty.isReservedProp(propKey)) {
          DOMPropertyOperations.setValueForAttribute(
            getNode(this),
            propKey,
            nextProp,
          );
        }
      } else if (!DOMProperty.isReservedProp(propKey)) {
        var node = getNode(this);
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
      if (__DEV__) {
        ReactInstrumentation.debugTool.onHostOperation({
          instanceID: this._debugID,
          type: 'update styles',
          payload: styleUpdates,
        });
      }
      CSSPropertyOperations.setValueForStyles(
        getNode(this),
        styleUpdates,
        this,
      );
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} lastProps
   * @param {object} nextProps
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   */
  _updateDOMChildren: function(lastProps, nextProps, transaction, context) {
    var lastContent = CONTENT_TYPES[typeof lastProps.children]
      ? lastProps.children
      : null;
    var nextContent = CONTENT_TYPES[typeof nextProps.children]
      ? nextProps.children
      : null;

    var lastHtml =
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html;
    var nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html;

    // Note the use of `!=` which checks for null or undefined.
    var lastChildren = lastContent != null ? null : lastProps.children;
    var nextChildren = nextContent != null ? null : nextProps.children;

    // If we're switching from children to content/html or vice versa, remove
    // the old content
    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction, context);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
      if (__DEV__) {
        ReactInstrumentation.debugTool.onSetChildren(this._debugID, []);
      }
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent);
        if (__DEV__) {
          setAndValidateContentChildDev.call(this, nextContent);
        }
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        this.updateMarkup('' + nextHtml);
      }
      if (__DEV__) {
        ReactInstrumentation.debugTool.onSetChildren(this._debugID, []);
      }
    } else if (nextChildren != null) {
      if (__DEV__) {
        setAndValidateContentChildDev.call(this, null);
      }

      this.updateChildren(nextChildren, transaction, context);
    }
  },

  getHostNode: function() {
    return getNode(this);
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function(safely, skipLifecycle) {
    switch (this._tag) {
      case 'audio':
      case 'form':
      case 'iframe':
      case 'img':
      case 'image':
      case 'link':
      case 'object':
      case 'source':
      case 'video':
        var listeners = this._wrapperState.listeners;
        if (listeners) {
          for (var i = 0; i < listeners.length; i++) {
            listeners[i].remove();
          }
        }
        break;
      case 'input':
      case 'textarea':
        inputValueTracking.stopTracking(getNode(this));
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
            '<head>, and <body>) reliably and efficiently. To fix this, have a ' +
            'single top-level component that never unmounts render these ' +
            'elements.',
          this._tag,
        );
        break;
    }

    this.unmountChildren(safely, skipLifecycle);
    ReactDOMComponentTree.uncacheNode(this);
    this._rootNodeID = 0;
    this._domID = 0;
    this._wrapperState = null;

    if (__DEV__) {
      setAndValidateContentChildDev.call(this, null);
    }
  },

  restoreControlledState: function() {
    switch (this._tag) {
      case 'input':
        ReactDOMInput.restoreControlledState(this);
        return;
      case 'textarea':
        ReactDOMTextarea.restoreControlledState(this);
        return;
      case 'select':
        ReactDOMSelect.restoreControlledState(this);
        return;
    }
  },

  getPublicInstance: function() {
    return getNode(this);
  },
};

Object.assign(
  ReactDOMComponent.prototype,
  ReactDOMComponent.Mixin,
  ReactMultiChild,
);

module.exports = ReactDOMComponent;
