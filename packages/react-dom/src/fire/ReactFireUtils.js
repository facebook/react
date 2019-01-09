/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {supportedInputTypes} from './ReactFireDOMConfig';
import {
  interactiveEvents,
  mediaEventTypes,
  normalizeKey,
  nonInteractiveEvents,
  translateToKey,
} from './events/ReactFireEventTypes';
import {
  capturedEventNameToPropNameMap,
  eventNameToPropNameMap,
} from './events/ReactFireEvents';
import {polyfilledEvents} from './events/ReactFirePolyfilledEvents';
import {
  COMMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  HTML_NAMESPACE,
  MATH_NAMESPACE,
  SVG_NAMESPACE,
  TEXT_NODE,
} from './ReactFireDOMConfig';

import type {FiberRoot} from 'react-reconciler/src/ReactFiberRoot';
import {HostComponent} from 'shared/ReactWorkTags';
import {canUseDOM} from 'shared/ExecutionEnvironment';
import type {AnyNativeEvent} from 'events/PluginModuleType';

export function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document,
): Document {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? (rootContainerElement: any)
    : rootContainerElement.ownerDocument;
}

export function isStringOrNumber(value: any): boolean {
  return typeof value === 'string' || typeof value === 'number';
}

export function isPropAnEvent(propName: string): boolean {
  if (
    propName.length < 3 ||
    propName[0] !== 'o' ||
    propName[1] !== 'n' ||
    propName[2].toLowerCase() === propName[2]
  ) {
    return false;
  }
  const eventName = normalizeEventName(propName);

  if (
    !capturedEventNameToPropNameMap.has(propName) &&
    !eventNameToPropNameMap.has(propName)
  ) {
    if (propName.indexOf('Capture') !== -1) {
      capturedEventNameToPropNameMap.set(eventName, propName);
    } else {
      eventNameToPropNameMap.set(eventName, propName);
    }
  }
  if (
    nonInteractiveEvents.has(eventName) ||
    interactiveEvents.has(eventName) ||
    mediaEventTypes.has(eventName)
  ) {
    return true;
  }
  return polyfilledEvents.hasOwnProperty(propName);
}

export function isCustomComponent(tagName: string, props: Object) {
  if (tagName.indexOf('-') === -1) {
    return typeof props.is === 'string';
  }
  switch (tagName) {
    // These are reserved SVG and MathML elements.
    // We don't mind this whitelist too much because we expect it to never grow.
    // The alternative is to track the namespace in a few places which is convoluted.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return false;
    default:
      return true;
  }
}

export function getNamespace(type: string): string {
  switch (type) {
    case 'svg':
      return SVG_NAMESPACE;
    case 'math':
      return MATH_NAMESPACE;
    default:
      return HTML_NAMESPACE;
  }
}

export function shouldAutoFocusHostComponent(
  type: string,
  props: Object,
): boolean {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}

export function normalizeEventName(name: string): string {
  if (name.endsWith('Capture')) {
    return normalizeEventName(name.slice(0, name.length - 7));
  }
  if (name === 'onDoubleClick') {
    return 'dblclick';
  }
  if (name === 'onContextMenu') {
    return 'contextMenu';
  }
  if (name === 'onTextInput') {
    return 'textInput';
  }
  return name.substr(2).toLowerCase();
}

export opaque type ToStringValue =
  | boolean
  | number
  | Object
  | string
  | null
  | void;

// Flow does not allow string concatenation of most non-string types. To work
// around this limitation, we use an opaque type that can only be obtained by
// passing the value through getToStringValue first.
export function toString(value: ToStringValue): string {
  return '' + (value: any);
}

export function getToStringValue(value: mixed): ToStringValue {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'object':
    case 'string':
    case 'undefined':
      return value;
    default:
      // function, symbol are assigned as empty strings
      return '';
  }
}

/**
 * True if the supplied DOM node is a valid node element.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @return {boolean} True if the DOM is a valid DOM node.
 * @internal
 */
export function isValidContainer(node: void | Node) {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        node.nodeValue === ' react-mount-point-unstable '))
  );
}

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
export function getEventTarget(
  nativeEvent: Event,
): void | null | Element | Node | Document {
  // Fallback to nativeEvent.srcElement for IE9
  // https://github.com/facebook/react/issues/12506
  let target = nativeEvent.target || nativeEvent.srcElement || window;

  // Normalize SVG <use> element events #4963
  if ((target: any).correspondingUseElement) {
    target = (target: any).correspondingUseElement;
  }

  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === TEXT_NODE
    ? ((target: any): Node).parentNode
    : ((target: any): Element | Document);
}

export function getActiveElement(
  doc: void | null | Document,
): null | void | Element {
  doc = doc || (typeof document !== 'undefined' ? document : undefined);
  if (typeof doc === 'undefined') {
    return null;
  }
  try {
    return doc.activeElement || doc.body;
  } catch (e) {
    return doc.body;
  }
}

function isTextNode(node) {
  return node && node.nodeType === TEXT_NODE;
}

export function containsNode(
  outerNode: null | void | Node | Element,
  innerNode: null | void | Node | Element,
) {
  if (!outerNode || !innerNode) {
    return false;
  } else if (outerNode === innerNode) {
    return true;
  } else if (isTextNode(outerNode)) {
    return false;
  } else if (isTextNode(innerNode)) {
    return containsNode(outerNode, innerNode.parentNode);
  } else if ('contains' in outerNode) {
    return outerNode.contains(innerNode);
  } else if (outerNode.compareDocumentPosition) {
    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
  } else {
    return false;
  }
}

export function isInDocument(node: Node): boolean {
  return (
    node &&
    node.ownerDocument &&
    containsNode(node.ownerDocument.documentElement, node)
  );
}

export function getActiveElementDeep(): Element | null | void {
  let win = window;
  let element = getActiveElement();
  while (element instanceof win.HTMLIFrameElement) {
    // Accessing the contentDocument of a HTMLIframeElement can cause the browser
    // to throw, e.g. if it has a cross-origin src attribute
    try {
      win = element.contentDocument.defaultView;
    } catch (e) {
      return element;
    }
    element = getActiveElement(win.document);
  }
  return element;
}

function getPublicInstance(instance: any) {
  return instance;
}

export function getPublicRootInstance(
  container: FiberRoot,
): React$Component<any, any> | Object | null {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}

export function getChildNamespace(
  parentNamespace: string | null,
  type: string,
): string {
  if (parentNamespace == null || parentNamespace === HTML_NAMESPACE) {
    // No (or default) parent namespace: potential entry point.
    return getNamespace(type);
  }
  if (parentNamespace === SVG_NAMESPACE && type === 'foreignObject') {
    // We're leaving SVG.
    return HTML_NAMESPACE;
  }
  // By default, pass namespace below.
  return parentNamespace;
}

export function createTextNode(
  text: string,
  rootContainerElement: Element | Document,
): Text {
  return getOwnerDocumentFromRootContainer(rootContainerElement).createTextNode(
    text,
  );
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
export function isEventSupported(eventNameSuffix: string): boolean {
  if (!canUseDOM) {
    return false;
  }

  const eventName = 'on' + eventNameSuffix;
  let isSupported = eventName in document;

  if (!isSupported) {
    const element = document.createElement('div');
    element.setAttribute(eventName, 'return;');
    isSupported = typeof (element: any)[eventName] === 'function';
  }

  return isSupported;
}

export function isTextInputElement(elem: ?HTMLElement): boolean {
  const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();

  if (nodeName === 'input') {
    return supportedInputTypes.has(((elem: any): HTMLInputElement).type);
  }

  if (nodeName === 'textarea') {
    return true;
  }

  return false;
}

/**
 * `charCode` represents the actual "character code" and is safe to use with
 * `String.fromCharCode`. As such, only keys that correspond to printable
 * characters produce a valid `charCode`, the only exception to this is Enter.
 * The Tab-key is considered non-printable and does not have a `charCode`,
 * presumably because it does not produce a tab-character in browsers.
 */
export function getEventCharCode(event: Event): number {
  let charCode;
  const keyCode = (event: any).keyCode;

  if ('charCode' in event) {
    charCode = (event: any).charCode;

    // FF does not set `charCode` for the Enter-key, check against `keyCode`.
    if (charCode === 0 && keyCode === 13) {
      charCode = 13;
    }
  } else {
    // IE8 does not implement `charCode`, but `keyCode` has the correct value.
    charCode = keyCode;
  }

  // IE and Edge (on Windows) and Chrome / Safari (on Windows and Linux)
  // report Enter as charCode 10 when ctrl is pressed.
  if (charCode === 10) {
    charCode = 13;
  }

  // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
  // Must not discard the (non-)printable Enter-key.
  if (charCode >= 32 || charCode === 13) {
    return charCode;
  }

  return 0;
}

/**
 * Translation from modifier key to the associated property in the event.
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
 */

const modifierKeyToProp = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Meta: 'metaKey',
  Shift: 'shiftKey',
};

// Older browsers (Safari <= 10, iOS Safari <= 10.2) do not support
// getModifierState. If getModifierState is not supported, we map it to a set of
// modifier keys exposed by the event. In this case, Lock-keys are not supported.
function modifierStateGetter(keyArg: string): boolean {
  const syntheticEvent = this;
  const nativeEvent = syntheticEvent.nativeEvent;
  if (nativeEvent.getModifierState) {
    return nativeEvent.getModifierState(keyArg);
  }
  const keyProp = modifierKeyToProp[keyArg];
  return keyProp ? !!nativeEvent[keyProp] : false;
}

export function getEventModifierState(
  nativeEvent: AnyNativeEvent,
): (keyArg: string) => boolean {
  return modifierStateGetter;
}

/**
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `key` property.
 */
export function getEventKey(nativeEvent: KeyboardEvent): string {
  if (nativeEvent.key) {
    // Normalize inconsistent values reported by browsers due to
    // implementations of a working draft specification.

    // FireFox implements `key` but returns `MozPrintableKey` for all
    // printable characters (normalized to `Unidentified`), ignore it.
    const key = normalizeKey[nativeEvent.key] || nativeEvent.key;
    if (key !== 'Unidentified') {
      return key;
    }
  }

  // Browser does not implement `key`, polyfill as much of it as we can.
  if (nativeEvent.type === 'keypress') {
    const charCode = getEventCharCode(nativeEvent);

    // The enter-key is technically both printable and non-printable and can
    // thus be captured by `keypress`, no other non-printable key should.
    return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
  }
  if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
    // While user keyboard layout determines the actual meaning of each
    // `keyCode` value, almost all function keys have a universal value.
    return translateToKey[nativeEvent.keyCode] || 'Unidentified';
  }
  return '';
}
