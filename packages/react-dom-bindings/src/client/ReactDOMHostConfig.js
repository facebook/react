/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';
import type {DOMEventName} from '../events/DOMEventNames';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {
  BoundingRect,
  IntersectionObserverOptions,
  ObserveVisibleRectsCallback,
} from 'react-reconciler/src/ReactTestSelectors';
import type {ReactScopeInstance} from 'shared/ReactTypes';
import type {AncestorInfoDev} from './validateDOMNesting';

import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';
import {DefaultEventPriority} from 'react-reconciler/src/ReactEventPriorities';
// TODO: Remove this deep import when we delete the legacy root API
import {ConcurrentMode, NoMode} from 'react-reconciler/src/ReactTypeOfMode';

import hasOwnProperty from 'shared/hasOwnProperty';
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';
import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals.js';
const {Dispatcher} = ReactDOMSharedInternals;

import {
  precacheFiberNode,
  updateFiberProps,
  getClosestInstanceFromNode,
  getFiberFromScopeInstance,
  getInstanceFromNode as getInstanceFromNodeDOMTree,
  isContainerMarkedAsRoot,
  detachDeletedInstance,
  getResourcesFromRoot,
  isMarkedHoistable,
  markNodeAsHoistable,
  isOwnedInstance,
} from './ReactDOMComponentTree';
export {detachDeletedInstance};
import {hasRole} from './DOMAccessibilityRoles';
import {
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  trapClickOnNonInteractiveElement,
  checkForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} from './ReactDOMComponent';
import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
import setTextContent from './setTextContent';
import {validateDOMNesting, updatedAncestorInfoDev} from './validateDOMNesting';
import {
  isEnabled as ReactBrowserEventEmitterIsEnabled,
  setEnabled as ReactBrowserEventEmitterSetEnabled,
  getEventPriority,
} from '../events/ReactDOMEventListener';
import {
  getChildNamespace,
  SVG_NAMESPACE,
  MATH_NAMESPACE,
} from './DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_TYPE_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from './HTMLNodeType';

import {retryIfBlockedOn} from '../events/ReactDOMEventReplaying';

import {
  enableCreateEventHandleAPI,
  enableScopeAPI,
  enableFloat,
  enableHostSingletons,
  enableTrustedTypesIntegration,
} from 'shared/ReactFeatureFlags';
import {
  HostComponent,
  HostHoistable,
  HostText,
  HostSingleton,
} from 'react-reconciler/src/ReactWorkTags';
import {listenToAllSupportedEvents} from '../events/DOMPluginEventSystem';
import {
  validatePreloadArguments,
  validatePreinitArguments,
  validateLinkPropsForStyleResource,
  getValueDescriptorExpectingObjectForWarning,
  getValueDescriptorExpectingEnumForWarning,
} from '../shared/ReactDOMResourceValidation';

export type Type = string;
export type Props = {
  autoFocus?: boolean,
  children?: mixed,
  disabled?: boolean,
  hidden?: boolean,
  suppressHydrationWarning?: boolean,
  dangerouslySetInnerHTML?: mixed,
  style?: {display?: string, ...},
  bottom?: null | number,
  left?: null | number,
  right?: null | number,
  top?: null | number,
  is?: string,
  size?: number,
  multiple?: boolean,
  ...
};
type RawProps = {
  [string]: mixed,
};
export type EventTargetChildElement = {
  type: string,
  props: null | {
    style?: {
      position?: string,
      zIndex?: number,
      bottom?: string,
      left?: string,
      right?: string,
      top?: string,
      ...
    },
    ...
  },
  ...
};
export type Container =
  | interface extends Element {_reactRootContainer?: FiberRoot}
  | interface extends Document {_reactRootContainer?: FiberRoot}
  | interface extends DocumentFragment {_reactRootContainer?: FiberRoot};
export type Instance = Element;
export type TextInstance = Text;
export interface SuspenseInstance extends Comment {
  _reactRetry?: () => void;
}
export type HydratableInstance = Instance | TextInstance | SuspenseInstance;
export type PublicInstance = Element | Text;
type HostContextDev = {
  namespace: HostContextProd,
  ancestorInfo: AncestorInfoDev,
};
type HostContextProd = string;
export type HostContext = HostContextDev | HostContextProd;
export type UpdatePayload = Array<mixed>;
export type ChildSet = void; // Unused
export type TimeoutHandle = TimeoutID;
export type NoTimeout = -1;
export type RendererInspectionConfig = $ReadOnly<{}>;

type SelectionInformation = {
  focusedElem: null | HTMLElement,
  selectionRange: mixed,
};

const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';

const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';

const STYLE = 'style';

let eventsEnabled: ?boolean = null;
let selectionInformation: null | SelectionInformation = null;

export * from 'react-reconciler/src/ReactFiberHostConfigWithNoPersistence';

function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document | DocumentFragment,
): Document {
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? (rootContainerElement: any)
    : rootContainerElement.ownerDocument;
}

export function getRootHostContext(
  rootContainerInstance: Container,
): HostContext {
  let type;
  let namespace: HostContextProd;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = (rootContainerInstance: any).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
      break;
    }
    default: {
      const container: any =
        nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
      break;
    }
  }
  if (__DEV__) {
    const validatedTag = type.toLowerCase();
    const ancestorInfo = updatedAncestorInfoDev(null, validatedTag);
    return {namespace, ancestorInfo};
  }
  return namespace;
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
): HostContext {
  if (__DEV__) {
    const parentHostContextDev = ((parentHostContext: any): HostContextDev);
    const namespace = getChildNamespace(parentHostContextDev.namespace, type);
    const ancestorInfo = updatedAncestorInfoDev(
      parentHostContextDev.ancestorInfo,
      type,
    );
    return {namespace, ancestorInfo};
  }
  const parentNamespace = ((parentHostContext: any): HostContextProd);
  return getChildNamespace(parentNamespace, type);
}

export function getPublicInstance(instance: Instance): Instance {
  return instance;
}

export function prepareForCommit(containerInfo: Container): Object | null {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  let activeInstance = null;
  if (enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}

export function beforeActiveInstanceBlur(internalInstanceHandle: Object): void {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur(
      (selectionInformation: any).focusedElem,
      internalInstanceHandle,
    );
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function afterActiveInstanceBlur(): void {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchAfterDetachedBlur((selectionInformation: any).focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function resetAfterCommit(containerInfo: Container): void {
  restoreSelection(selectionInformation);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}

export function createHoistableInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  internalInstanceHandle: Object,
): Instance {
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );

  const domElement: Instance = ownerDocument.createElement(type);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  setInitialProperties(domElement, type, props);
  markNodeAsHoistable(domElement);
  return domElement;
}

let didWarnScriptTags = false;
const warnedUnknownTags: {
  [key: string]: boolean,
} = {
  // There are working polyfills for <dialog>. Let people use it.
  dialog: true,
  // Electron ships a custom <webview> tag to display external web content in
  // an isolated frame and process.
  // This tag is not present in non Electron environments such as JSDom which
  // is often used for testing purposes.
  // @see https://electronjs.org/docs/api/webview-tag
  webview: true,
};

export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): Instance {
  let namespace;
  if (__DEV__) {
    // TODO: take namespace into account when validating.
    const hostContextDev: HostContextDev = (hostContext: any);
    validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    if (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    ) {
      const string = '' + props.children;
      const ownAncestorInfo = updatedAncestorInfoDev(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
    namespace = hostContextDev.namespace;
  } else {
    const hostContextProd: HostContextProd = (hostContext: any);
    namespace = hostContextProd;
  }

  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );

  let domElement: Instance;
  switch (namespace) {
    case SVG_NAMESPACE:
    case MATH_NAMESPACE:
      domElement = ownerDocument.createElementNS(namespace, type);
      break;
    default:
      switch (type) {
        case 'svg': {
          domElement = ownerDocument.createElementNS(SVG_NAMESPACE, type);
          break;
        }
        case 'math': {
          domElement = ownerDocument.createElementNS(MATH_NAMESPACE, type);
          break;
        }
        case 'script': {
          // Create the script via .innerHTML so its "parser-inserted" flag is
          // set to true and it does not execute
          const div = ownerDocument.createElement('div');
          if (__DEV__) {
            if (enableTrustedTypesIntegration && !didWarnScriptTags) {
              console.error(
                'Encountered a script tag while rendering React component. ' +
                  'Scripts inside React components are never executed when rendering ' +
                  'on the client. Consider using template tag instead ' +
                  '(https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).',
              );
              didWarnScriptTags = true;
            }
          }
          div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
          // This is guaranteed to yield a script element.
          const firstChild = ((div.firstChild: any): HTMLScriptElement);
          domElement = div.removeChild(firstChild);
          break;
        }
        case 'select': {
          if (typeof props.is === 'string') {
            domElement = ownerDocument.createElement('select', {is: props.is});
          } else {
            // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
            // See discussion in https://github.com/facebook/react/pull/6896
            // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
            domElement = ownerDocument.createElement('select');
          }
          if (props.multiple) {
            domElement.multiple = true;
          } else if (props.size) {
            // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
            // it is possible that no option is selected.
            //
            // This is only necessary when a select in "single selection mode".
            domElement.size = props.size;
          }
          break;
        }
        default: {
          if (typeof props.is === 'string') {
            domElement = ownerDocument.createElement(type, {is: props.is});
          } else {
            // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
            // See discussion in https://github.com/facebook/react/pull/6896
            // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
            domElement = ownerDocument.createElement(type);
          }

          if (__DEV__) {
            if (type.indexOf('-') === -1) {
              // We're not SVG/MathML and we don't have a dash, so we're not a custom element
              // Even if you use `is`, these should be of known type and lower case.
              if (type !== type.toLowerCase()) {
                console.error(
                  '<%s /> is using incorrect casing. ' +
                    'Use PascalCase for React components, ' +
                    'or lowercase for HTML elements.',
                  type,
                );
              }
              if (
                // $FlowFixMe[method-unbinding]
                Object.prototype.toString.call(domElement) ===
                  '[object HTMLUnknownElement]' &&
                !hasOwnProperty.call(warnedUnknownTags, type)
              ) {
                warnedUnknownTags[type] = true;
                console.error(
                  'The tag <%s> is unrecognized in this browser. ' +
                    'If you meant to render a React component, start its name with ' +
                    'an uppercase letter.',
                  type,
                );
              }
            }
          }
        }
      }
  }
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}

export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props);
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
    case 'img':
      return true;
    default:
      return false;
  }
}

export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  hostContext: HostContext,
): null | Array<mixed> {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    if (
      typeof newProps.children !== typeof oldProps.children &&
      (typeof newProps.children === 'string' ||
        typeof newProps.children === 'number')
    ) {
      const string = '' + newProps.children;
      const ownAncestorInfo = updatedAncestorInfoDev(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
  }
  return diffProperties(domElement, type, oldProps, newProps);
}

export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): TextInstance {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    validateDOMNesting(null, text, hostContextDev.ancestorInfo);
  }
  const textNode: TextInstance = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  ).createTextNode(text);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export function getCurrentEventPriority(): EventPriority {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout: any =
  typeof setTimeout === 'function' ? setTimeout : (undefined: any);
export const cancelTimeout: any =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined: any);
export const noTimeout = -1;
const localPromise = typeof Promise === 'function' ? Promise : undefined;
const localRequestAnimationFrame =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : scheduleTimeout;

export function getInstanceFromNode(node: HTMLElement): null | Object {
  return getClosestInstanceFromNode(node) || null;
}

export function preparePortalMount(portalInstance: Instance): void {
  listenToAllSupportedEvents(portalInstance);
}

export function prepareScopeUpdate(
  scopeInstance: ReactScopeInstance,
  internalInstanceHandle: Object,
): void {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}

export function getInstanceFromScope(
  scopeInstance: ReactScopeInstance,
): null | Object {
  if (enableScopeAPI) {
    return getFiberFromScopeInstance(scopeInstance);
  }
  return null;
}

// -------------------
//     Microtasks
// -------------------
export const supportsMicrotasks = true;
export const scheduleMicrotask: any =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof localPromise !== 'undefined'
    ? callback =>
        localPromise.resolve(null).then(callback).catch(handleErrorInNextTick)
    : scheduleTimeout; // TODO: Determine the best fallback here.

function handleErrorInNextTick(error: any) {
  setTimeout(() => {
    throw error;
  });
}

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function commitMount(
  domElement: Instance,
  type: string,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      if (newProps.autoFocus) {
        ((domElement: any):
          | HTMLButtonElement
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement).focus();
      }
      return;
    case 'img': {
      if ((newProps: any).src) {
        ((domElement: any): HTMLImageElement).src = (newProps: any).src;
      }
      return;
    }
  }
}

export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
}

export function resetTextContent(domElement: Instance): void {
  setTextContent(domElement, '');
}

export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string,
): void {
  textInstance.nodeValue = newText;
}

export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = (container.parentNode: any);
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((parentNode: any): HTMLElement));
  }
}

export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  parentInstance.insertBefore(child, beforeChild);
}

export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance | SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

function createEvent(type: DOMEventName, bubbles: boolean): Event {
  const event = document.createEvent('Event');
  event.initEvent(((type: any): string), bubbles, false);
  return event;
}

function dispatchBeforeDetachedBlur(
  target: HTMLElement,
  internalInstanceHandle: Object,
): void {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('beforeblur', true);
    // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    // $FlowFixMe[prop-missing]: internal field
    event._detachedInterceptFiber = internalInstanceHandle;
    target.dispatchEvent(event);
  }
}

function dispatchAfterDetachedBlur(target: HTMLElement): void {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('afterblur', false);
    // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.
    (event: any).relatedTarget = target;
    // Dispatch the event on the document.
    document.dispatchEvent(event);
  }
}

export function removeChild(
  parentInstance: Instance,
  child: Instance | TextInstance | SuspenseInstance,
): void {
  parentInstance.removeChild(child);
}

export function removeChildFromContainer(
  container: Container,
  child: Instance | TextInstance | SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function clearSuspenseBoundary(
  parentInstance: Instance,
  suspenseInstance: SuspenseInstance,
): void {
  let node: Node = suspenseInstance;
  // Delete all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  do {
    const nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && nextNode.nodeType === COMMENT_NODE) {
      const data = ((nextNode: any).data: string);
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          parentInstance.removeChild(nextNode);
          // Retry if any event replaying was blocked on this.
          retryIfBlockedOn(suspenseInstance);
          return;
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA
      ) {
        depth++;
      }
    }
    // $FlowFixMe[incompatible-type] we bail out when we get a null
    node = nextNode;
  } while (node);
  // TODO: Warn, we didn't find the end comment boundary.
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

export function clearSuspenseBoundaryFromContainer(
  container: Container,
  suspenseInstance: SuspenseInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    clearSuspenseBoundary((container.parentNode: any), suspenseInstance);
  } else if (container.nodeType === ELEMENT_NODE) {
    clearSuspenseBoundary((container: any), suspenseInstance);
  } else {
    // Document nodes should never contain suspense boundaries.
  }
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function hideInstance(instance: Instance): void {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = ((instance: any): HTMLElement);
  const style = instance.style;
  // $FlowFixMe[method-unbinding]
  if (typeof style.setProperty === 'function') {
    style.setProperty('display', 'none', 'important');
  } else {
    style.display = 'none';
  }
}

export function hideTextInstance(textInstance: TextInstance): void {
  textInstance.nodeValue = '';
}

export function unhideInstance(instance: Instance, props: Props): void {
  instance = ((instance: any): HTMLElement);
  const styleProp = props[STYLE];
  const display =
    styleProp !== undefined &&
    styleProp !== null &&
    styleProp.hasOwnProperty('display')
      ? styleProp.display
      : null;
  instance.style.display =
    display == null || typeof display === 'boolean'
      ? ''
      : // The value would've errored already if it wasn't safe.
        // eslint-disable-next-line react-internal/safe-string-coercion
        ('' + display).trim();
}

export function unhideTextInstance(
  textInstance: TextInstance,
  text: string,
): void {
  textInstance.nodeValue = text;
}

export function clearContainer(container: Container): void {
  if (enableHostSingletons) {
    const nodeType = container.nodeType;
    if (nodeType === DOCUMENT_NODE) {
      clearContainerSparingly(container);
    } else if (nodeType === ELEMENT_NODE) {
      switch (container.nodeName) {
        case 'HEAD':
        case 'HTML':
        case 'BODY':
          clearContainerSparingly(container);
          return;
        default: {
          container.textContent = '';
        }
      }
    }
  } else {
    if (container.nodeType === ELEMENT_NODE) {
      // We have refined the container to Element type
      const element: Element = (container: any);
      element.textContent = '';
    } else if (container.nodeType === DOCUMENT_NODE) {
      // We have refined the container to Document type
      const doc: Document = (container: any);
      if (doc.documentElement) {
        doc.removeChild(doc.documentElement);
      }
    }
  }
}

function clearContainerSparingly(container: Node) {
  let node;
  let nextNode: ?Node = container.firstChild;
  if (nextNode && nextNode.nodeType === DOCUMENT_TYPE_NODE) {
    nextNode = nextNode.nextSibling;
  }
  while (nextNode) {
    node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case 'HTML':
      case 'HEAD':
      case 'BODY': {
        const element: Element = (node: any);
        clearContainerSparingly(element);
        // If these singleton instances had previously been rendered with React they
        // may still hold on to references to the previous fiber tree. We detatch them
        // prospectively to reset them to a baseline starting state since we cannot create
        // new instances.
        detachDeletedInstance(element);
        continue;
      }
      case 'STYLE': {
        continue;
      }
      case 'LINK': {
        if (((node: any): HTMLLinkElement).rel.toLowerCase() === 'stylesheet') {
          continue;
        }
      }
    }
    container.removeChild(node);
  }
  return;
}

// Making this so we can eventually move all of the instance caching to the commit phase.
// Currently this is only used to associate fiber and props to instances for hydrating
// HostSingletons. The reason we need it here is we only want to make this binding on commit
// because only one fiber can own the instance at a time and render can fail/restart
export function bindInstance(
  instance: Instance,
  props: Props,
  internalInstanceHandle: mixed,
) {
  precacheFiberNode((internalInstanceHandle: any), instance);
  updateFiberProps(instance, props);
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

// With Resources, some HostComponent types will never be server rendered and need to be
// inserted without breaking hydration
export function isHydratableType(type: string, props: Props): boolean {
  if (enableFloat) {
    if (type === 'script') {
      const {async, onLoad, onError} = (props: any);
      return !(async && (onLoad || onError));
    }
    return true;
  } else {
    return true;
  }
}
export function isHydratableText(text: string): boolean {
  return text !== '';
}

export function shouldSkipHydratableForInstance(
  instance: HydratableInstance,
  type: string,
  props: Props,
): boolean {
  if (instance.nodeType !== ELEMENT_NODE) {
    // This is a suspense boundary or Text node.
    // Suspense Boundaries are never expected to be injected by 3rd parties. If we see one it should be matched
    // and this is a hydration error.
    // Text Nodes are also not expected to be injected by 3rd parties. This is less of a guarantee for <body>
    // but it seems reasonable and conservative to reject this as a hydration error as well
    return false;
  } else if (
    instance.nodeName.toLowerCase() !== type.toLowerCase() ||
    isMarkedHoistable(instance)
  ) {
    // We are either about to
    return true;
  } else {
    // We have an Element with the right type.
    const element: Element = (instance: any);
    const anyProps = (props: any);

    // We are going to try to exclude it if we can definitely identify it as a hoisted Node or if
    // we can guess that the node is likely hoisted or was inserted by a 3rd party script or browser extension
    // using high entropy attributes for certain types. This technique will fail for strange insertions like
    // extension prepending <div> in the <body> but that already breaks before and that is an edge case.
    switch (type) {
      // case 'title':
      //We assume all titles are matchable. You should only have one in the Document, at least in a hoistable scope
      // and if you are a HostComponent with type title we must either be in an <svg> context or this title must have an `itemProp` prop.
      case 'meta': {
        // The only way to opt out of hoisting meta tags is to give it an itemprop attribute. We assume there will be
        // not 3rd party meta tags that are prepended, accepting the cases where this isn't true because meta tags
        // are usually only functional for SSR so even in a rare case where we did bind to an injected tag the runtime
        // implications are minimal
        if (!element.hasAttribute('itemprop')) {
          // This is a Hoistable
          return true;
        }
        break;
      }
      case 'link': {
        // Links come in many forms and we do expect 3rd parties to inject them into <head> / <body>. We exclude known resources
        // and then use high-entroy attributes like href which are almost always used and almost always unique to filter out unlikely
        // matches.
        const rel = element.getAttribute('rel');
        if (rel === 'stylesheet' && element.hasAttribute('data-precedence')) {
          // This is a stylesheet resource
          return true;
        } else if (
          rel !== anyProps.rel ||
          element.getAttribute('href') !==
            (anyProps.href == null ? null : anyProps.href) ||
          element.getAttribute('crossorigin') !==
            (anyProps.crossOrigin == null ? null : anyProps.crossOrigin) ||
          element.getAttribute('title') !==
            (anyProps.title == null ? null : anyProps.title)
        ) {
          // rel + href should usually be enough to uniquely identify a link however crossOrigin can vary for rel preconnect
          // and title could vary for rel alternate
          return true;
        }
        break;
      }
      case 'style': {
        // Styles are hard to match correctly. We can exclude known resources but otherwise we accept the fact that a non-hoisted style tags
        // in <head> or <body> are likely never going to be unmounted given their position in the document and the fact they likely hold global styles
        if (element.hasAttribute('data-precedence')) {
          // This is a style resource
          return true;
        }
        break;
      }
      case 'script': {
        // Scripts are a little tricky, we exclude known resources and then similar to links try to use high-entropy attributes
        // to reject poor matches. One challenge with scripts are inline scripts. We don't attempt to check text content which could
        // in theory lead to a hydration error later if a 3rd party injected an inline script before the React rendered nodes.
        // Falling back to client rendering if this happens should be seemless though so we will try this hueristic and revisit later
        // if we learn it is problematic
        const srcAttr = element.getAttribute('src');
        if (
          srcAttr &&
          element.hasAttribute('async') &&
          !element.hasAttribute('itemprop')
        ) {
          // This is an async script resource
          return true;
        } else if (
          srcAttr !== (anyProps.src == null ? null : anyProps.src) ||
          element.getAttribute('type') !==
            (anyProps.type == null ? null : anyProps.type) ||
          element.getAttribute('crossorigin') !==
            (anyProps.crossOrigin == null ? null : anyProps.crossOrigin)
        ) {
          // This script is for a different src
          return true;
        }
        break;
      }
    }
    // We have excluded the most likely cases of mismatch between hoistable tags, 3rd party script inserted tags,
    // and browser extension inserted tags. While it is possible this is not the right match it is a decent hueristic
    // that should work in the vast majority of cases.
    return false;
  }
}

export function shouldSkipHydratableForTextInstance(
  instance: HydratableInstance,
): boolean {
  return instance.nodeType === ELEMENT_NODE;
}

export function shouldSkipHydratableForSuspenseInstance(
  instance: HydratableInstance,
): boolean {
  return instance.nodeType === ELEMENT_NODE;
}

export function canHydrateInstance(
  instance: HydratableInstance,
  type: string,
  props: Props,
): null | Instance {
  if (
    instance.nodeType !== ELEMENT_NODE ||
    instance.nodeName.toLowerCase() !== type.toLowerCase()
  ) {
    return null;
  } else {
    return ((instance: any): Instance);
  }
}

export function canHydrateTextInstance(
  instance: HydratableInstance,
  text: string,
): null | TextInstance {
  if (text === '') return null;

  if (instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a text node.
  return ((instance: any): TextInstance);
}

export function canHydrateSuspenseInstance(
  instance: HydratableInstance,
): null | SuspenseInstance {
  if (instance.nodeType !== COMMENT_NODE) {
    return null;
  }
  // This has now been refined to a suspense node.
  return ((instance: any): SuspenseInstance);
}

export function isSuspenseInstancePending(instance: SuspenseInstance): boolean {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}

export function isSuspenseInstanceFallback(
  instance: SuspenseInstance,
): boolean {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}

export function getSuspenseInstanceFallbackErrorDetails(
  instance: SuspenseInstance,
): {digest: ?string, message?: string, stack?: string} {
  const dataset =
    instance.nextSibling && ((instance.nextSibling: any): HTMLElement).dataset;
  let digest, message, stack;
  if (dataset) {
    digest = dataset.dgst;
    if (__DEV__) {
      message = dataset.msg;
      stack = dataset.stck;
    }
  }
  if (__DEV__) {
    return {
      message,
      digest,
      stack,
    };
  } else {
    // Object gets DCE'd if constructed in tail position and matches callsite destructuring
    return {
      digest,
    };
  }
}

export function registerSuspenseInstanceRetry(
  instance: SuspenseInstance,
  callback: () => void,
) {
  instance._reactRetry = callback;
}

function getNextHydratable(node: ?Node) {
  // Skip non-hydratable nodes.
  for (; node != null; node = ((node: any): Node).nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
    if (nodeType === COMMENT_NODE) {
      const nodeData = (node: any).data;
      if (
        nodeData === SUSPENSE_START_DATA ||
        nodeData === SUSPENSE_FALLBACK_START_DATA ||
        nodeData === SUSPENSE_PENDING_START_DATA
      ) {
        break;
      }
      if (nodeData === SUSPENSE_END_DATA) {
        return null;
      }
    }
  }
  return (node: any);
}

export function getNextHydratableSibling(
  instance: HydratableInstance,
): null | HydratableInstance {
  return getNextHydratable(instance.nextSibling);
}

export function getFirstHydratableChild(
  parentInstance: Instance,
): null | HydratableInstance {
  return getNextHydratable(parentInstance.firstChild);
}

export function getFirstHydratableChildWithinContainer(
  parentContainer: Container,
): null | HydratableInstance {
  return getNextHydratable(parentContainer.firstChild);
}

export function getFirstHydratableChildWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
): null | HydratableInstance {
  return getNextHydratable(parentInstance.nextSibling);
}

export function hydrateInstance(
  instance: Instance,
  type: string,
  props: Props,
  hostContext: HostContext,
  internalInstanceHandle: Object,
  shouldWarnDev: boolean,
): null | Array<mixed> {
  precacheFiberNode(internalInstanceHandle, instance);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  updateFiberProps(instance, props);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode =
    ((internalInstanceHandle: Fiber).mode & ConcurrentMode) !== NoMode;

  let parentNamespace;
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    parentNamespace = hostContextDev.namespace;
  } else {
    const hostContextProd = ((hostContext: any): HostContextProd);
    parentNamespace = hostContextProd;
  }

  return diffHydratedProperties(
    instance,
    type,
    props,
    isConcurrentMode,
    shouldWarnDev,
    parentNamespace,
  );
}

export function hydrateTextInstance(
  textInstance: TextInstance,
  text: string,
  internalInstanceHandle: Object,
  shouldWarnDev: boolean,
): boolean {
  precacheFiberNode(internalInstanceHandle, textInstance);

  // TODO: Temporary hack to check if we're in a concurrent root. We can delete
  // when the legacy root API is removed.
  const isConcurrentMode =
    ((internalInstanceHandle: Fiber).mode & ConcurrentMode) !== NoMode;

  return diffHydratedText(textInstance, text, isConcurrentMode);
}

export function hydrateSuspenseInstance(
  suspenseInstance: SuspenseInstance,
  internalInstanceHandle: Object,
) {
  precacheFiberNode(internalInstanceHandle, suspenseInstance);
}

export function getNextHydratableInstanceAfterSuspenseInstance(
  suspenseInstance: SuspenseInstance,
): null | HydratableInstance {
  let node = suspenseInstance.nextSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node: any).data: string);
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling((node: any));
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        depth++;
      }
    }
    node = node.nextSibling;
  }
  // TODO: Warn, we didn't find the end comment boundary.
  return null;
}

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance(
  targetInstance: Node,
): null | SuspenseInstance {
  let node = targetInstance.previousSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node: any).data: string);
      if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        if (depth === 0) {
          return ((node: any): SuspenseInstance);
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}

export function commitHydratedContainer(container: Container): void {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function commitHydratedSuspenseInstance(
  suspenseInstance: SuspenseInstance,
): void {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

// @TODO remove this function once float lands and hydrated tail nodes
// are controlled by HostSingleton fibers
export function shouldDeleteUnhydratedTailInstances(
  parentType: string,
): boolean {
  return parentType !== 'head' && parentType !== 'body';
}

export function didNotMatchHydratedContainerTextInstance(
  parentContainer: Container,
  textInstance: TextInstance,
  text: string,
  isConcurrentMode: boolean,
  shouldWarnDev: boolean,
) {
  checkForUnmatchedText(
    textInstance.nodeValue,
    text,
    isConcurrentMode,
    shouldWarnDev,
  );
}

export function didNotMatchHydratedTextInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  textInstance: TextInstance,
  text: string,
  isConcurrentMode: boolean,
  shouldWarnDev: boolean,
) {
  if (parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    checkForUnmatchedText(
      textInstance.nodeValue,
      text,
      isConcurrentMode,
      shouldWarnDev,
    );
  }
}

export function didNotHydrateInstanceWithinContainer(
  parentContainer: Container,
  instance: HydratableInstance,
) {
  if (__DEV__) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentContainer, (instance: any));
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentContainer, (instance: any));
    }
  }
}

export function didNotHydrateInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
  instance: HydratableInstance,
) {
  if (__DEV__) {
    // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
    const parentNode: Element | Document | null = parentInstance.parentNode;
    if (parentNode !== null) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentNode, (instance: any));
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentNode, (instance: any));
      }
    }
  }
}

export function didNotHydrateInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  instance: HydratableInstance,
  isConcurrentMode: boolean,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      if (instance.nodeType === ELEMENT_NODE) {
        warnForDeletedHydratableElement(parentInstance, (instance: any));
      } else if (instance.nodeType === COMMENT_NODE) {
        // TODO: warnForDeletedHydratableSuspenseBoundary
      } else {
        warnForDeletedHydratableText(parentInstance, (instance: any));
      }
    }
  }
}

export function didNotFindHydratableInstanceWithinContainer(
  parentContainer: Container,
  type: string,
  props: Props,
) {
  if (__DEV__) {
    warnForInsertedHydratedElement(parentContainer, type, props);
  }
}

export function didNotFindHydratableTextInstanceWithinContainer(
  parentContainer: Container,
  text: string,
) {
  if (__DEV__) {
    warnForInsertedHydratedText(parentContainer, text);
  }
}

export function didNotFindHydratableSuspenseInstanceWithinContainer(
  parentContainer: Container,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentContainer);
  }
}

export function didNotFindHydratableInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
  type: string,
  props: Props,
) {
  if (__DEV__) {
    // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
    const parentNode: Element | Document | null = parentInstance.parentNode;
    if (parentNode !== null)
      warnForInsertedHydratedElement(parentNode, type, props);
  }
}

export function didNotFindHydratableTextInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
  text: string,
) {
  if (__DEV__) {
    // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
    const parentNode: Element | Document | null = parentInstance.parentNode;
    if (parentNode !== null) warnForInsertedHydratedText(parentNode, text);
  }
}

export function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(
  parentInstance: SuspenseInstance,
) {
  if (__DEV__) {
    // const parentNode: Element | Document | null = parentInstance.parentNode;
    // TODO: warnForInsertedHydratedSuspense(parentNode);
  }
}

export function didNotFindHydratableInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  type: string,
  props: Props,
  isConcurrentMode: boolean,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedElement(parentInstance, type, props);
    }
  }
}

export function didNotFindHydratableTextInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
  text: string,
  isConcurrentMode: boolean,
) {
  if (__DEV__) {
    if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
      warnForInsertedHydratedText(parentInstance, text);
    }
  }
}

export function didNotFindHydratableSuspenseInstance(
  parentType: string,
  parentProps: Props,
  parentInstance: Instance,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentInstance);
  }
}

export function errorHydratingContainer(parentContainer: Container): void {
  if (__DEV__) {
    // TODO: This gets logged by onRecoverableError, too, so we should be
    // able to remove it.
    console.error(
      'An error occurred during hydration. The server HTML was replaced with client content in <%s>.',
      parentContainer.nodeName.toLowerCase(),
    );
  }
}

// -------------------
//     Test Selectors
// -------------------

export const supportsTestSelectors = true;

export function findFiberRoot(node: Instance): null | FiberRoot {
  const stack = [node];
  let index = 0;
  while (index < stack.length) {
    const current = stack[index++];
    if (isContainerMarkedAsRoot(current)) {
      return ((getInstanceFromNodeDOMTree(current): any): FiberRoot);
    }
    stack.push(...current.children);
  }
  return null;
}

export function getBoundingRect(node: Instance): BoundingRect {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function matchAccessibilityRole(node: Instance, role: string): boolean {
  if (hasRole(node, role)) {
    return true;
  }

  return false;
}

export function getTextContent(fiber: Fiber): string | null {
  switch (fiber.tag) {
    case HostHoistable:
    case HostSingleton:
    case HostComponent:
      let textContent = '';
      const childNodes = fiber.stateNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          textContent += childNode.textContent;
        }
      }
      return textContent;
    case HostText:
      return fiber.stateNode.textContent;
  }

  return null;
}

export function isHiddenSubtree(fiber: Fiber): boolean {
  return fiber.tag === HostComponent && fiber.memoizedProps.hidden === true;
}

export function setFocusIfFocusable(node: Instance): boolean {
  // The logic for determining if an element is focusable is kind of complex,
  // and since we want to actually change focus anyway- we can just skip it.
  // Instead we'll just listen for a "focus" event to verify that focus was set.
  //
  // We could compare the node to document.activeElement after focus,
  // but this would not handle the case where application code managed focus to automatically blur.
  let didFocus = false;
  const handleFocus = () => {
    didFocus = true;
  };

  const element = ((node: any): HTMLElement);
  try {
    element.addEventListener('focus', handleFocus);
    // $FlowFixMe[method-unbinding]
    (element.focus || HTMLElement.prototype.focus).call(element);
  } finally {
    element.removeEventListener('focus', handleFocus);
  }

  return didFocus;
}

type RectRatio = {
  ratio: number,
  rect: BoundingRect,
};

export function setupIntersectionObserver(
  targets: Array<Instance>,
  callback: ObserveVisibleRectsCallback,
  options?: IntersectionObserverOptions,
): {
  disconnect: () => void,
  observe: (instance: Instance) => void,
  unobserve: (instance: Instance) => void,
} {
  const rectRatioCache: Map<Instance, RectRatio> = new Map();
  targets.forEach(target => {
    rectRatioCache.set(target, {
      rect: getBoundingRect(target),
      ratio: 0,
    });
  });

  const handleIntersection = (entries: Array<IntersectionObserverEntry>) => {
    entries.forEach(entry => {
      const {boundingClientRect, intersectionRatio, target} = entry;
      rectRatioCache.set(target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
        },
        ratio: intersectionRatio,
      });
    });

    callback(Array.from(rectRatioCache.values()));
  };

  const observer = new IntersectionObserver(handleIntersection, options);
  targets.forEach(target => {
    observer.observe((target: any));
  });

  return {
    disconnect: () => observer.disconnect(),
    observe: target => {
      rectRatioCache.set(target, {
        rect: getBoundingRect(target),
        ratio: 0,
      });
      observer.observe((target: any));
    },
    unobserve: target => {
      rectRatioCache.delete(target);
      observer.unobserve((target: any));
    },
  };
}

export function requestPostPaintCallback(callback: (time: number) => void) {
  localRequestAnimationFrame(() => {
    localRequestAnimationFrame(time => callback(time));
  });
}

// -------------------
//     Singletons
// -------------------

export const supportsSingletons = true;

export function isHostSingletonType(type: string): boolean {
  return type === 'html' || type === 'head' || type === 'body';
}

export function resolveSingletonInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  validateDOMNestingDev: boolean,
): Instance {
  if (__DEV__) {
    const hostContextDev = ((hostContext: any): HostContextDev);
    if (validateDOMNestingDev) {
      validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    }
  }
  const ownerDocument = getOwnerDocumentFromRootContainer(
    rootContainerInstance,
  );
  switch (type) {
    case 'html': {
      const documentElement = ownerDocument.documentElement;
      if (!documentElement) {
        throw new Error(
          'React expected an <html> element (document.documentElement) to exist in the Document but one was' +
            ' not found. React never removes the documentElement for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return documentElement;
    }
    case 'head': {
      const head = ownerDocument.head;
      if (!head) {
        throw new Error(
          'React expected a <head> element (document.head) to exist in the Document but one was' +
            ' not found. React never removes the head for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return head;
    }
    case 'body': {
      const body = ownerDocument.body;
      if (!body) {
        throw new Error(
          'React expected a <body> element (document.body) to exist in the Document but one was' +
            ' not found. React never removes the body for any Document it renders into so' +
            ' the cause is likely in some other script running on this page.',
        );
      }
      return body;
    }
    default: {
      throw new Error(
        'resolveSingletonInstance was called with an element type that is not supported. This is a bug in React.',
      );
    }
  }
}

export function acquireSingletonInstance(
  type: string,
  props: Props,
  instance: Instance,
  internalInstanceHandle: Object,
): void {
  if (__DEV__) {
    const currentInstanceHandle = getInstanceFromNodeDOMTree(instance);
    if (currentInstanceHandle) {
      const tagName = instance.tagName.toLowerCase();
      console.error(
        'You are mounting a new %s component when a previous one has not first unmounted. It is an' +
          ' error to render more than one %s component at a time and attributes and children of these' +
          ' components will likely fail in unpredictable ways. Please only render a single instance of' +
          ' <%s> and if you need to mount a new one, ensure any previous ones have unmounted first.',
        tagName,
        tagName,
        tagName,
      );
    }
    switch (type) {
      case 'html':
      case 'head':
      case 'body': {
        break;
      }
      default: {
        console.error(
          'acquireSingletonInstance was called with an element type that is not supported. This is a bug in React.',
        );
      }
    }
  }

  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }

  setInitialProperties(instance, type, props);
  precacheFiberNode(internalInstanceHandle, instance);
  updateFiberProps(instance, props);
}

export function releaseSingletonInstance(instance: Instance): void {
  const attributes = instance.attributes;
  while (attributes.length) {
    instance.removeAttributeNode(attributes[0]);
  }
  detachDeletedInstance(instance);
}

export function clearSingleton(instance: Instance): void {
  const element: Element = (instance: any);
  let node = element.firstChild;
  while (node) {
    const nextNode = node.nextSibling;
    const nodeName = node.nodeName;
    if (
      isMarkedHoistable(node) ||
      nodeName === 'HEAD' ||
      nodeName === 'BODY' ||
      nodeName === 'STYLE' ||
      (nodeName === 'LINK' &&
        ((node: any): HTMLLinkElement).rel.toLowerCase() === 'stylesheet')
    ) {
      // retain these nodes
    } else {
      element.removeChild(node);
    }
    node = nextNode;
  }
  return;
}

// -------------------
//     Resources
// -------------------

export const supportsResources = true;

// The resource types we support. currently they match the form for the as argument.
// In the future this may need to change, especially when modules / scripts are supported
type ResourceType = 'style' | 'font' | 'script';

type HoistableTagType = 'link' | 'meta' | 'title';
type TResource<
  T: 'stylesheet' | 'style' | 'script' | 'void',
  S: null | {...},
> = {
  type: T,
  instance: null | Instance,
  count: number,
  state: S,
};
type StylesheetResource = TResource<'stylesheet', StylesheetState>;
type StyleTagResource = TResource<'style', null>;
type StyleResource = StyleTagResource | StylesheetResource;
type ScriptResource = TResource<'script', null>;
type VoidResource = TResource<'void', null>;
export type Resource = StyleResource | ScriptResource | VoidResource;

type LoadingState = number;
const NotLoaded = /*       */ 0b000;
const Loaded = /*          */ 0b001;
const Errored = /*         */ 0b010;
const Settled = /*         */ 0b011;
const Inserted = /*        */ 0b100;

type StylesheetState = {
  loading: LoadingState,
  preload: null | HTMLLinkElement,
};

type StyleTagProps = {
  'data-href': string,
  'data-precedence': string,
  [string]: mixed,
};
type StylesheetProps = {
  rel: 'stylesheet',
  href: string,
  'data-precedence': string,
  [string]: mixed,
};

type ScriptProps = {
  src: string,
  async: true,
  [string]: mixed,
};

type PreloadProps = {
  rel: 'preload',
  href: string,
  [string]: mixed,
};

export type RootResources = {
  hoistableStyles: Map<string, StyleResource>,
  hoistableScripts: Map<string, ScriptResource>,
};

export function prepareToCommitHoistables() {
  tagCaches = null;
}

// It is valid to preload even when we aren't actively rendering. For cases where Float functions are
// called when there is no rendering we track the last used document. It is not safe to insert
// arbitrary resources into the lastCurrentDocument b/c it may not actually be the document
// that the resource is meant to apply too (for example stylesheets or scripts). This is only
// appropriate for resources that don't really have a strict tie to the document itself for example
// preloads
let lastCurrentDocument: ?Document = null;
let previousDispatcher = null;
export function prepareRendererToRender(rootContainer: Container) {
  if (enableFloat) {
    const rootNode = getHoistableRoot(rootContainer);
    lastCurrentDocument = getDocumentFromRoot(rootNode);

    previousDispatcher = Dispatcher.current;
    Dispatcher.current = ReactDOMClientDispatcher;
  }
}

export function resetRendererAfterRender() {
  if (enableFloat) {
    Dispatcher.current = previousDispatcher;
    previousDispatcher = null;
  }
}

// global collections of Resources
const preloadPropsMap: Map<string, PreloadProps> = new Map();
const preconnectsSet: Set<string> = new Set();

export type HoistableRoot = Document | ShadowRoot;

// getRootNode is missing from IE and old jsdom versions
export function getHoistableRoot(container: Container): HoistableRoot {
  // $FlowFixMe[method-unbinding]
  return typeof container.getRootNode === 'function'
    ? /* $FlowFixMe[incompatible-return] Flow types this as returning a `Node`,
       * but it's either a `Document` or `ShadowRoot`. */
      container.getRootNode()
    : container.ownerDocument;
}

function getCurrentResourceRoot(): null | HoistableRoot {
  const currentContainer = getCurrentRootHostContainer();
  return currentContainer ? getHoistableRoot(currentContainer) : null;
}

// Preloads are somewhat special. Even if we don't have the Document
// used by the root that is rendering a component trying to insert a preload
// we can still seed the file cache by doing the preload on any document we have
// access to. We prefer the currentDocument if it exists, we also prefer the
// lastCurrentDocument if that exists. As a fallback we will use the window.document
// if available.
function getDocumentForPreloads(): ?Document {
  const root = getCurrentResourceRoot();
  if (root) {
    return root.ownerDocument || root;
  } else {
    try {
      return lastCurrentDocument || window.document;
    } catch (error) {
      return null;
    }
  }
}

function getDocumentFromRoot(root: HoistableRoot): Document {
  return root.ownerDocument || root;
}

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> HostConfig -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher = {
  prefetchDNS,
  preconnect,
  preload,
  preinit,
};

function preconnectAs(
  rel: 'preconnect' | 'dns-prefetch',
  crossOrigin: null | '' | 'use-credentials',
  href: string,
) {
  const ownerDocument = getDocumentForPreloads();
  if (typeof href === 'string' && href && ownerDocument) {
    const limitedEscapedHref =
      escapeSelectorAttributeValueInsideDoubleQuotes(href);
    let key = `link[rel="${rel}"][href="${limitedEscapedHref}"]`;
    if (typeof crossOrigin === 'string') {
      key += `[crossorigin="${crossOrigin}"]`;
    }
    if (!preconnectsSet.has(key)) {
      preconnectsSet.add(key);

      const preconnectProps = {rel, crossOrigin, href};
      if (null === ownerDocument.querySelector(key)) {
        const instance = ownerDocument.createElement('link');
        setInitialProperties(instance, 'link', preconnectProps);
        markNodeAsHoistable(instance);
        (ownerDocument.head: any).appendChild(instance);
      }
    }
  }
}

function prefetchDNS(href: string, options?: mixed) {
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null) {
      if (
        typeof options === 'object' &&
        hasOwnProperty.call(options, 'crossOrigin')
      ) {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      } else {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      }
    }
  }
  preconnectAs('dns-prefetch', null, href);
}

function preconnect(href: string, options?: {crossOrigin?: string}) {
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null && typeof options !== 'object') {
      console.error(
        'ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.',
        getValueDescriptorExpectingEnumForWarning(options),
      );
    } else if (options != null && typeof options.crossOrigin !== 'string') {
      console.error(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.',
        getValueDescriptorExpectingObjectForWarning(options.crossOrigin),
      );
    }
  }
  const crossOrigin =
    options == null || typeof options.crossOrigin !== 'string'
      ? null
      : options.crossOrigin === 'use-credentials'
      ? 'use-credentials'
      : '';
  preconnectAs('preconnect', crossOrigin, href);
}

type PreloadAs = ResourceType;
type PreloadOptions = {
  as: PreloadAs,
  crossOrigin?: string,
  integrity?: string,
  type?: string,
};
function preload(href: string, options: PreloadOptions) {
  if (__DEV__) {
    validatePreloadArguments(href, options);
  }
  const ownerDocument = getDocumentForPreloads();
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null &&
    ownerDocument
  ) {
    const as = options.as;
    const limitedEscapedHref =
      escapeSelectorAttributeValueInsideDoubleQuotes(href);
    const preloadKey = `link[rel="preload"][as="${as}"][href="${limitedEscapedHref}"]`;
    let key = preloadKey;
    switch (as) {
      case 'style':
        key = getStyleKey(href);
        break;
      case 'script':
        key = getScriptKey(href);
        break;
    }
    if (!preloadPropsMap.has(key)) {
      const preloadProps = preloadPropsFromPreloadOptions(href, as, options);
      preloadPropsMap.set(key, preloadProps);

      if (null === ownerDocument.querySelector(preloadKey)) {
        const instance = ownerDocument.createElement('link');
        setInitialProperties(instance, 'link', preloadProps);
        markNodeAsHoistable(instance);
        (ownerDocument.head: any).appendChild(instance);
      }
    }
  }
}

function preloadPropsFromPreloadOptions(
  href: string,
  as: ResourceType,
  options: PreloadOptions,
): PreloadProps {
  return {
    href,
    rel: 'preload',
    as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity,
    type: options.type,
  };
}

type PreinitAs = 'style' | 'script';
type PreinitOptions = {
  as: PreinitAs,
  precedence?: string,
  crossOrigin?: string,
  integrity?: string,
};
function preinit(href: string, options: PreinitOptions) {
  if (__DEV__) {
    validatePreinitArguments(href, options);
  }

  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null
  ) {
    const resourceRoot = getCurrentResourceRoot();
    const as = options.as;
    if (!resourceRoot) {
      if (as === 'style' || as === 'script') {
        // We are going to emit a preload as a best effort fallback since this preinit
        // was called outside of a render. Given the passive nature of this fallback
        // we do not warn in dev when props disagree if there happens to already be a
        // matching preload with this href
        const preloadDocument = getDocumentForPreloads();
        if (preloadDocument) {
          const limitedEscapedHref =
            escapeSelectorAttributeValueInsideDoubleQuotes(href);
          const preloadKey = `link[rel="preload"][as="${as}"][href="${limitedEscapedHref}"]`;
          let key = preloadKey;
          switch (as) {
            case 'style':
              key = getStyleKey(href);
              break;
            case 'script':
              key = getScriptKey(href);
              break;
          }
          if (!preloadPropsMap.has(key)) {
            const preloadProps = preloadPropsFromPreinitOptions(
              href,
              as,
              options,
            );
            preloadPropsMap.set(key, preloadProps);

            if (null === preloadDocument.querySelector(preloadKey)) {
              const instance = preloadDocument.createElement('link');
              setInitialProperties(instance, 'link', preloadProps);
              markNodeAsHoistable(instance);
              (preloadDocument.head: any).appendChild(instance);
            }
          }
        }
      }
      return;
    }

    switch (as) {
      case 'style': {
        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;

        const key = getStyleKey(href);
        const precedence = options.precedence || 'default';

        // Check if this resource already exists
        let resource = styles.get(key);
        if (resource) {
          // We can early return. The resource exists and there is nothing
          // more to do
          return;
        }

        const state = {
          loading: NotLoaded,
          preload: null,
        };

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = resourceRoot.querySelector(
          getStylesheetSelectorFromKey(key),
        );
        if (instance) {
          state.loading = Loaded;
        } else {
          // Construct a new instance and insert it
          const stylesheetProps = stylesheetPropsFromPreinitOptions(
            href,
            precedence,
            options,
          );
          const preloadProps = preloadPropsMap.get(key);
          if (preloadProps) {
            adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
          }
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          const link = (instance = ownerDocument.createElement('link'));
          markNodeAsHoistable(link);
          setInitialProperties(link, 'link', stylesheetProps);

          (link: any)._p = new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
          });
          link.addEventListener('load', () => {
            state.loading |= Loaded;
          });
          link.addEventListener('error', () => {
            state.loading |= Errored;
          });

          state.loading |= Inserted;
          insertStylesheet(instance, precedence, resourceRoot);
        }

        // Construct a Resource and cache it
        resource = {
          type: 'stylesheet',
          instance,
          count: 1,
          state,
        };
        styles.set(key, resource);
        return;
      }
      case 'script': {
        const src = href;
        const scripts = getResourcesFromRoot(resourceRoot).hoistableScripts;

        const key = getScriptKey(src);

        // Check if this resource already exists
        let resource = scripts.get(key);
        if (resource) {
          // We can early return. The resource exists and there is nothing
          // more to do
          return;
        }

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = resourceRoot.querySelector(
          getScriptSelectorFromKey(key),
        );
        if (!instance) {
          // Construct a new instance and insert it
          const scriptProps = scriptPropsFromPreinitOptions(src, options);
          // Adopt certain preload props
          const preloadProps = preloadPropsMap.get(key);
          if (preloadProps) {
            adoptPreloadPropsForScript(scriptProps, preloadProps);
          }
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          instance = ownerDocument.createElement('script');
          markNodeAsHoistable(instance);
          setInitialProperties(instance, 'link', scriptProps);
          (ownerDocument.head: any).appendChild(instance);
        }

        // Construct a Resource and cache it
        resource = {
          type: 'script',
          instance,
          count: 1,
          state: null,
        };
        scripts.set(key, resource);
        return;
      }
    }
  }
}

function preloadPropsFromPreinitOptions(
  href: string,
  as: ResourceType,
  options: PreinitOptions,
): PreloadProps {
  return {
    href,
    rel: 'preload',
    as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity,
  };
}

function stylesheetPropsFromPreinitOptions(
  href: string,
  precedence: string,
  options: PreinitOptions,
): StylesheetProps {
  return {
    rel: 'stylesheet',
    href,
    'data-precedence': precedence,
    crossOrigin: options.crossOrigin,
  };
}

function scriptPropsFromPreinitOptions(
  src: string,
  options: PreinitOptions,
): ScriptProps {
  return {
    src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
  };
}

type StyleTagQualifyingProps = {
  href: string,
  precedence: string,
  [string]: mixed,
};

type StylesheetQualifyingProps = {
  rel: 'stylesheet',
  href: string,
  precedence: string,
  [string]: mixed,
};

// This function is called in begin work and we should always have a currentDocument set
export function getResource(
  type: string,
  currentProps: any,
  pendingProps: any,
): null | Resource {
  const resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) {
    throw new Error(
      '"resourceRoot" was expected to exist. This is a bug in React.',
    );
  }
  switch (type) {
    case 'meta':
    case 'title': {
      return null;
    }
    case 'style': {
      if (
        typeof pendingProps.precedence === 'string' &&
        typeof pendingProps.href === 'string'
      ) {
        const key = getStyleKey(pendingProps.href);
        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;
        let resource = styles.get(key);
        if (!resource) {
          resource = {
            type: 'style',
            instance: null,
            count: 0,
            state: null,
          };
          styles.set(key, resource);
        }
        return resource;
      }
      return {
        type: 'void',
        instance: null,
        count: 0,
        state: null,
      };
    }
    case 'link': {
      if (
        pendingProps.rel === 'stylesheet' &&
        typeof pendingProps.href === 'string' &&
        typeof pendingProps.precedence === 'string'
      ) {
        const qualifiedProps: StylesheetQualifyingProps = pendingProps;
        const key = getStyleKey(qualifiedProps.href);

        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;

        let resource = styles.get(key);
        if (!resource) {
          // We asserted this above but Flow can't figure out that the type satisfies
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          resource = {
            type: 'stylesheet',
            instance: null,
            count: 0,
            state: {
              loading: NotLoaded,
              preload: null,
            },
          };
          styles.set(key, resource);
          if (!preloadPropsMap.has(key)) {
            preloadStylesheet(
              ownerDocument,
              key,
              preloadPropsFromStylesheet(qualifiedProps),
              resource.state,
            );
          }
        }
        return resource;
      }
      return null;
    }
    case 'script': {
      if (typeof pendingProps.src === 'string' && pendingProps.async === true) {
        const scriptProps: ScriptProps = pendingProps;
        const key = getScriptKey(scriptProps.src);
        const scripts = getResourcesFromRoot(resourceRoot).hoistableScripts;

        let resource = scripts.get(key);
        if (!resource) {
          resource = {
            type: 'script',
            instance: null,
            count: 0,
            state: null,
          };
          scripts.set(key, resource);
        }
        return resource;
      }
      return {
        type: 'void',
        instance: null,
        count: 0,
        state: null,
      };
    }
    default: {
      throw new Error(
        `getResource encountered a type it did not expect: "${type}". this is a bug in React.`,
      );
    }
  }
}

function styleTagPropsFromRawProps(
  rawProps: StyleTagQualifyingProps,
): StyleTagProps {
  return {
    ...rawProps,
    'data-href': rawProps.href,
    'data-precedence': rawProps.precedence,
    href: null,
    precedence: null,
  };
}

function getStyleKey(href: string) {
  const limitedEscapedHref =
    escapeSelectorAttributeValueInsideDoubleQuotes(href);
  return `href~="${limitedEscapedHref}"`;
}

function getStyleTagSelectorFromKey(key: string) {
  return `style[data-${key}]`;
}

function getStylesheetSelectorFromKey(key: string) {
  return `link[rel="stylesheet"][${key}]`;
}

function getPreloadStylesheetSelectorFromKey(key: string) {
  return `link[rel="preload"][as="style"][${key}]`;
}

function stylesheetPropsFromRawProps(
  rawProps: StylesheetQualifyingProps,
): StylesheetProps {
  return {
    ...rawProps,
    'data-precedence': rawProps.precedence,
    precedence: null,
  };
}
function preloadStylesheet(
  ownerDocument: Document,
  key: string,
  preloadProps: PreloadProps,
  state: StylesheetState,
) {
  preloadPropsMap.set(key, preloadProps);

  if (!ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) {
    // There is no matching stylesheet instance in the Document.
    // We will insert a preload now to kick off loading because
    // we expect this stylesheet to commit
    const preloadEl = ownerDocument.querySelector(
      getPreloadStylesheetSelectorFromKey(key),
    );
    if (preloadEl) {
      // If we find a preload already it was SSR'd and we won't have an actual
      // loading state to track. For now we will just assume it is loaded
      state.loading = Loaded;
    } else {
      const instance = ownerDocument.createElement('link');
      state.preload = instance;
      instance.addEventListener('load', () => (state.loading |= Loaded));
      instance.addEventListener('error', () => (state.loading |= Errored));
      setInitialProperties(instance, 'link', preloadProps);
      markNodeAsHoistable(instance);
      (ownerDocument.head: any).appendChild(instance);
    }
  }
}

function preloadPropsFromStylesheet(
  props: StylesheetQualifyingProps,
): PreloadProps {
  return {
    rel: 'preload',
    as: 'style',
    href: props.href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
  };
}

function getScriptKey(src: string): string {
  const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  return `[src="${limitedEscapedSrc}"]`;
}

function getScriptSelectorFromKey(key: string): string {
  return 'script[async]' + key;
}

export function acquireResource(
  hoistableRoot: HoistableRoot,
  resource: Resource,
  props: any,
): null | Instance {
  resource.count++;
  if (resource.instance === null) {
    switch (resource.type) {
      case 'style': {
        const qualifiedProps: StyleTagQualifyingProps = props;
        const key = getStyleKey(qualifiedProps.href);

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = hoistableRoot.querySelector(
          getStyleTagSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        const styleProps = styleTagPropsFromRawProps(props);
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('style');

        markNodeAsHoistable(instance);
        setInitialProperties(instance, 'style', styleProps);

        // TODO: `style` does not have loading state for tracking insertions. I
        // guess because these aren't suspensey? Not sure whether this is a
        // factoring smell.
        // resource.state.loading |= Inserted;
        insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        resource.instance = instance;

        return instance;
      }
      case 'stylesheet': {
        // This typing is enforce by `getResource`. If we change the logic
        // there for what qualifies as a stylesheet resource we need to ensure
        // this cast still makes sense;
        const qualifiedProps: StylesheetQualifyingProps = props;
        const key = getStyleKey(qualifiedProps.href);

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = hoistableRoot.querySelector(
          getStylesheetSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        const stylesheetProps = stylesheetPropsFromRawProps(props);
        const preloadProps = preloadPropsMap.get(key);
        if (preloadProps) {
          adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
        }

        // Construct and insert a new instance
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('link');
        markNodeAsHoistable(instance);
        const linkInstance: HTMLLinkElement = (instance: any);
        (linkInstance: any)._p = new Promise((resolve, reject) => {
          linkInstance.onload = resolve;
          linkInstance.onerror = reject;
        });
        setInitialProperties(instance, 'link', stylesheetProps);
        resource.state.loading |= Inserted;
        insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        resource.instance = instance;

        return instance;
      }
      case 'script': {
        // This typing is enforce by `getResource`. If we change the logic
        // there for what qualifies as a stylesheet resource we need to ensure
        // this cast still makes sense;
        const borrowedScriptProps: ScriptProps = props;
        const key = getScriptKey(borrowedScriptProps.src);

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = hoistableRoot.querySelector(
          getScriptSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        let scriptProps = borrowedScriptProps;
        const preloadProps = preloadPropsMap.get(key);
        if (preloadProps) {
          scriptProps = {...borrowedScriptProps};
          adoptPreloadPropsForScript(scriptProps, preloadProps);
        }

        // Construct and insert a new instance
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('script');
        markNodeAsHoistable(instance);
        setInitialProperties(instance, 'link', scriptProps);
        (ownerDocument.head: any).appendChild(instance);
        resource.instance = instance;

        return instance;
      }
      case 'void': {
        return null;
      }
      default: {
        throw new Error(
          `acquireResource encountered a resource type it did not expect: "${resource.type}". this is a bug in React.`,
        );
      }
    }
  } else {
    // In the case of stylesheets, they might have already been assigned an
    // instance during `suspendResource`. But that doesn't mean they were
    // inserted, because the commit might have been interrupted. So we need to
    // check now.
    //
    // The other resource types are unaffected because they are not
    // yet suspensey.
    //
    // TODO: This is a bit of a code smell. Consider refactoring how
    // `suspendResource` and `acquireResource` work together. The idea is that
    // `suspendResource` does all the same stuff as `acquireResource` except
    // for the insertion.
    if (
      resource.type === 'stylesheet' &&
      (resource.state.loading & Inserted) === NotLoaded
    ) {
      const qualifiedProps: StylesheetQualifyingProps = props;
      const instance: Instance = resource.instance;
      resource.state.loading |= Inserted;
      insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
    }
  }
  return resource.instance;
}

export function releaseResource(resource: Resource): void {
  resource.count--;
}

function insertStylesheet(
  instance: Element,
  precedence: string,
  root: HoistableRoot,
): void {
  const nodes = root.querySelectorAll(
    'link[rel="stylesheet"][data-precedence],style[data-precedence]',
  );
  const last = nodes.length ? nodes[nodes.length - 1] : null;
  let prior = last;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePrecedence = node.dataset.precedence;
    if (nodePrecedence === precedence) {
      prior = node;
    } else if (prior !== last) {
      break;
    }
  }

  if (prior) {
    // We get the prior from the document so we know it is in the tree.
    // We also know that links can't be the topmost Node so the parentNode
    // must exist.
    ((prior.parentNode: any): Node).insertBefore(instance, prior.nextSibling);
  } else {
    const parent =
      root.nodeType === DOCUMENT_NODE
        ? ((((root: any): Document).head: any): Element)
        : ((root: any): ShadowRoot);
    parent.insertBefore(instance, parent.firstChild);
  }
}

function adoptPreloadPropsForStylesheet(
  stylesheetProps: StylesheetProps,
  preloadProps: PreloadProps,
): void {
  if (stylesheetProps.crossOrigin == null)
    stylesheetProps.crossOrigin = preloadProps.crossOrigin;
  if (stylesheetProps.referrerPolicy == null)
    stylesheetProps.referrerPolicy = preloadProps.referrerPolicy;
  if (stylesheetProps.title == null) stylesheetProps.title = preloadProps.title;
}

function adoptPreloadPropsForScript(
  scriptProps: ScriptProps,
  preloadProps: PreloadProps,
): void {
  if (scriptProps.crossOrigin == null)
    scriptProps.crossOrigin = preloadProps.crossOrigin;
  if (scriptProps.referrerPolicy == null)
    scriptProps.referrerPolicy = preloadProps.referrerPolicy;
  if (scriptProps.integrity == null)
    scriptProps.referrerPolicy = preloadProps.integrity;
}

type KeyedTagCache = Map<string, Array<Element>>;
type DocumentTagCaches = Map<Document, KeyedTagCache>;
let tagCaches: null | DocumentTagCaches = null;

export function hydrateHoistable(
  hoistableRoot: HoistableRoot,
  type: HoistableTagType,
  props: any,
  internalInstanceHandle: Object,
): Instance {
  const ownerDocument = getDocumentFromRoot(hoistableRoot);

  let instance: ?Instance = null;
  getInstance: switch (type) {
    case 'title': {
      instance = ownerDocument.getElementsByTagName('title')[0];
      if (
        !instance ||
        isOwnedInstance(instance) ||
        instance.namespaceURI === SVG_NAMESPACE ||
        instance.hasAttribute('itemprop')
      ) {
        instance = ownerDocument.createElement(type);
        (ownerDocument.head: any).insertBefore(
          instance,
          ownerDocument.querySelector('head > title'),
        );
      }
      setInitialProperties(instance, type, props);
      precacheFiberNode(internalInstanceHandle, instance);
      markNodeAsHoistable(instance);
      return instance;
    }
    case 'link': {
      const cache = getHydratableHoistableCache('link', 'href', ownerDocument);
      const key = type + (props.href || '');
      const maybeNodes = cache.get(key);
      if (maybeNodes) {
        const nodes = maybeNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (
            node.getAttribute('href') !==
              (props.href == null ? null : props.href) ||
            node.getAttribute('rel') !==
              (props.rel == null ? null : props.rel) ||
            node.getAttribute('title') !==
              (props.title == null ? null : props.title) ||
            node.getAttribute('crossorigin') !==
              (props.crossOrigin == null ? null : props.crossOrigin)
          ) {
            // mismatch, try the next node;
            continue;
          }
          instance = node;
          nodes.splice(i, 1);
          break getInstance;
        }
      }
      instance = ownerDocument.createElement(type);
      setInitialProperties(instance, type, props);
      (ownerDocument.head: any).appendChild(instance);
      break;
    }
    case 'meta': {
      const cache = getHydratableHoistableCache(
        'meta',
        'content',
        ownerDocument,
      );
      const key = type + (props.content || '');
      const maybeNodes = cache.get(key);
      if (maybeNodes) {
        const nodes = maybeNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // We coerce content to string because it is the most likely one to
          // use a `toString` capable value. For the rest we just do identity match
          // passing non-strings here is not really valid anyway.
          if (__DEV__) {
            checkAttributeStringCoercion(props.content, 'content');
          }
          if (
            node.getAttribute('content') !==
              (props.content == null ? null : '' + props.content) ||
            node.getAttribute('name') !==
              (props.name == null ? null : props.name) ||
            node.getAttribute('property') !==
              (props.property == null ? null : props.property) ||
            node.getAttribute('http-equiv') !==
              (props.httpEquiv == null ? null : props.httpEquiv) ||
            node.getAttribute('charset') !==
              (props.charSet == null ? null : props.charSet)
          ) {
            // mismatch, try the next node;
            continue;
          }
          instance = node;
          nodes.splice(i, 1);
          break getInstance;
        }
      }
      instance = ownerDocument.createElement(type);
      setInitialProperties(instance, type, props);
      (ownerDocument.head: any).appendChild(instance);
      break;
    }
    default:
      throw new Error(
        `getNodesForType encountered a type it did not expect: "${type}". This is a bug in React.`,
      );
  }

  // This node is a match
  precacheFiberNode(internalInstanceHandle, instance);
  markNodeAsHoistable(instance);
  return instance;
}

function getHydratableHoistableCache(
  type: HoistableTagType,
  keyAttribute: string,
  ownerDocument: Document,
): KeyedTagCache {
  let cache: KeyedTagCache;
  let caches: DocumentTagCaches;
  if (tagCaches === null) {
    cache = new Map();
    caches = tagCaches = new Map();
    caches.set(ownerDocument, cache);
  } else {
    caches = tagCaches;
    const maybeCache = caches.get(ownerDocument);
    if (!maybeCache) {
      cache = new Map();
      caches.set(ownerDocument, cache);
    } else {
      cache = maybeCache;
    }
  }

  if (cache.has(type)) {
    // We use type as a special key that signals that this cache has been seeded for this type
    return cache;
  }

  // Mark this cache as seeded for this type
  cache.set(type, (null: any));

  const nodes = ownerDocument.getElementsByTagName(type);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (
      !isOwnedInstance(node) &&
      (type !== 'link' || node.getAttribute('rel') !== 'stylesheet') &&
      node.namespaceURI !== SVG_NAMESPACE
    ) {
      const nodeKey = node.getAttribute(keyAttribute) || '';
      const key = type + nodeKey;
      const existing = cache.get(key);
      if (existing) {
        existing.push(node);
      } else {
        cache.set(key, [node]);
      }
    }
  }

  return cache;
}

export function mountHoistable(
  hoistableRoot: HoistableRoot,
  type: HoistableTagType,
  instance: Instance,
): void {
  const ownerDocument = getDocumentFromRoot(hoistableRoot);
  (ownerDocument.head: any).insertBefore(
    instance,
    type === 'title' ? ownerDocument.querySelector('head > title') : null,
  );
}

export function unmountHoistable(instance: Instance): void {
  (instance.parentNode: any).removeChild(instance);
}

// When passing user input into querySelector(All) the embedded string must not alter
// the semantics of the query. This escape function is safe to use when we know the
// provided value is going to be wrapped in double quotes as part of an attribute selector
// Do not use it anywhere else
// we escape double quotes and backslashes
const escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n\"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value: string): string {
  return value.replace(
    escapeSelectorAttributeValueInsideDoubleQuotesRegex,
    ch => '\\' + ch.charCodeAt(0).toString(16),
  );
}

export function isHostHoistableType(
  type: string,
  props: RawProps,
  hostContext: HostContext,
): boolean {
  let outsideHostContainerContext: boolean;
  let namespace: HostContextProd;
  if (__DEV__) {
    const hostContextDev: HostContextDev = (hostContext: any);
    // We can only render resources when we are not within the host container context
    outsideHostContainerContext =
      !hostContextDev.ancestorInfo.containerTagInScope;
    namespace = hostContextDev.namespace;
  } else {
    const hostContextProd: HostContextProd = (hostContext: any);
    namespace = hostContextProd;
  }

  // Global opt out of hoisting for anything in SVG Namespace or anything with an itemProp inside an itemScope
  if (namespace === SVG_NAMESPACE || props.itemProp != null) {
    if (__DEV__) {
      if (
        outsideHostContainerContext &&
        props.itemProp != null &&
        (type === 'meta' ||
          type === 'title' ||
          type === 'style' ||
          type === 'link' ||
          type === 'script')
      ) {
        console.error(
          'Cannot render a <%s> outside the main document if it has an `itemProp` prop. `itemProp` suggests the tag belongs to an' +
            ' `itemScope` which can appear anywhere in the DOM. If you were intending for React to hoist this <%s> remove the `itemProp` prop.' +
            ' Otherwise, try moving this tag into the <head> or <body> of the Document.',
          type,
          type,
        );
      }
    }
    return false;
  }

  switch (type) {
    case 'meta':
    case 'title': {
      return true;
    }
    case 'style': {
      if (
        typeof props.precedence !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === ''
      ) {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            console.error(
              'Cannot render a <style> outside the main document without knowing its precedence and a unique href key.' +
                ' React can hoist and deduplicate <style> tags if you provide a `precedence` prop along with an `href` prop that' +
                ' does not conflic with the `href` values used in any other hoisted <style> or <link rel="stylesheet" ...> tags. ' +
                ' Note that hoisting <style> tags is considered an advanced feature that most will not use directly.' +
                ' Consider moving the <style> tag to the <head> or consider adding a `precedence="default"` and `href="some unique resource identifier"`, or move the <style>' +
                ' to the <style> tag.',
            );
          }
        }
        return false;
      }
      return true;
    }
    case 'link': {
      if (
        typeof props.rel !== 'string' ||
        typeof props.href !== 'string' ||
        props.href === '' ||
        props.onLoad ||
        props.onError
      ) {
        if (__DEV__) {
          if (
            props.rel === 'stylesheet' &&
            typeof props.precedence === 'string'
          ) {
            validateLinkPropsForStyleResource(props);
          }
          if (outsideHostContainerContext) {
            if (
              typeof props.rel !== 'string' ||
              typeof props.href !== 'string' ||
              props.href === ''
            ) {
              console.error(
                'Cannot render a <link> outside the main document without a `rel` and `href` prop.' +
                  ' Try adding a `rel` and/or `href` prop to this <link> or moving the link into the <head> tag',
              );
            } else if (props.onError || props.onLoad) {
              console.error(
                'Cannot render a <link> with onLoad or onError listeners outside the main document.' +
                  ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            }
          }
        }
        return false;
      }
      switch (props.rel) {
        case 'stylesheet': {
          const {precedence, disabled} = props;
          if (__DEV__) {
            if (typeof precedence !== 'string') {
              if (outsideHostContainerContext) {
                console.error(
                  'Cannot render a <link rel="stylesheet" /> outside the main document without knowing its precedence.' +
                    ' Consider adding precedence="default" or moving it into the root <head> tag.',
                );
              }
            }
          }
          return typeof precedence === 'string' && disabled == null;
        }
        default: {
          return true;
        }
      }
    }
    case 'script': {
      if (
        props.async !== true ||
        props.onLoad ||
        props.onError ||
        typeof props.src !== 'string' ||
        !props.src
      ) {
        if (__DEV__) {
          if (outsideHostContainerContext) {
            if (props.async !== true) {
              console.error(
                'Cannot render a sync or defer <script> outside the main document without knowing its order.' +
                  ' Try adding async="" or moving it into the root <head> tag.',
              );
            } else if (props.onLoad || props.onError) {
              console.error(
                'Cannot render a <script> with onLoad or onError listeners outside the main document.' +
                  ' Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            } else {
              console.error(
                'Cannot render a <script> outside the main document without `async={true}` and a non-empty `src` prop.' +
                  ' Ensure there is a valid `src` and either make the script async or move it into the root <head> tag or' +
                  ' somewhere in the <body>.',
              );
            }
          }
        }
        return false;
      }
      return true;
    }
    case 'noscript':
    case 'template': {
      if (__DEV__) {
        if (outsideHostContainerContext) {
          console.error(
            'Cannot render <%s> outside the main document. Try moving it into the root <head> tag.',
            type,
          );
        }
      }
      return false;
    }
  }
  return false;
}

export function maySuspendCommit(type: Type, props: Props): boolean {
  return false;
}

export function mayResourceSuspendCommit(resource: Resource): boolean {
  return (
    resource.type === 'stylesheet' &&
    (resource.state.loading & Inserted) === NotLoaded
  );
}

export function preloadInstance(type: Type, props: Props): boolean {
  // Return true to indicate it's already loaded
  return true;
}

export function preloadResource(resource: Resource): boolean {
  if (
    resource.type === 'stylesheet' &&
    (resource.state.loading & Settled) === NotLoaded
  ) {
    // we have not finished loading the underlying stylesheet yet.
    return false;
  }
  // Return true to indicate it's already loaded
  return true;
}

type SuspendedState = {
  stylesheets: null | Map<StylesheetResource, HoistableRoot>,
  count: number,
  unsuspend: null | (() => void),
};
let suspendedState: null | SuspendedState = null;

// We use a noop function when we begin suspending because if possible we want the
// waitfor step to finish synchronously. If it doesn't we'll return a function to
// provide the actual unsuspend function and that will get completed when the count
// hits zero or it will get cancelled if the root starts new work.
function noop() {}

export function startSuspendingCommit(): void {
  suspendedState = {
    stylesheets: null,
    count: 0,
    unsuspend: noop,
  };
}

export function suspendInstance(type: Type, props: Props): void {
  return;
}

export function suspendResource(
  hoistableRoot: HoistableRoot,
  resource: Resource,
  props: any,
): void {
  if (suspendedState === null) {
    throw new Error(
      'Internal React Error: suspendedState null when it was expected to exists. Please report this as a React bug.',
    );
  }
  const state = suspendedState;
  if (resource.type === 'stylesheet') {
    if (typeof props.media === 'string') {
      // If we don't currently match media we avoid suspending on this resource
      // and let it insert on the mutation path
      if (matchMedia(props.media).matches === false) {
        return;
      }
    }
    if (resource.instance === null) {
      const qualifiedProps: StylesheetQualifyingProps = props;
      const key = getStyleKey(qualifiedProps.href);

      // Attempt to hydrate instance from DOM
      let instance: null | Instance = hoistableRoot.querySelector(
        getStylesheetSelectorFromKey(key),
      );
      if (instance) {
        // If this instance has a loading state it came from the Fizz runtime.
        // If there is not loading state it is assumed to have been server rendered
        // as part of the preamble and therefore synchronously loaded. It could have
        // errored however which we still do not yet have a means to detect. For now
        // we assume it is loaded.
        const maybeLoadingState: ?Promise<mixed> = (instance: any)._p;
        if (
          maybeLoadingState !== null &&
          typeof maybeLoadingState === 'object' &&
          // $FlowFixMe[method-unbinding]
          typeof maybeLoadingState.then === 'function'
        ) {
          const loadingState = maybeLoadingState;
          state.count++;
          const ping = onUnsuspend.bind(state);
          loadingState.then(ping, ping);
        }
        resource.state.loading |= Inserted;
        resource.instance = instance;
        markNodeAsHoistable(instance);
        return;
      }

      const ownerDocument = getDocumentFromRoot(hoistableRoot);

      const stylesheetProps = stylesheetPropsFromRawProps(props);
      const preloadProps = preloadPropsMap.get(key);
      if (preloadProps) {
        adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
      }

      // Construct and insert a new instance
      instance = ownerDocument.createElement('link');
      markNodeAsHoistable(instance);
      const linkInstance: HTMLLinkElement = (instance: any);
      // This Promise is a loading state used by the Fizz runtime. We need this incase there is a race
      // between this resource being rendered on the client and being rendered with a late completed boundary.
      (linkInstance: any)._p = new Promise((resolve, reject) => {
        linkInstance.onload = resolve;
        linkInstance.onerror = reject;
      });
      setInitialProperties(instance, 'link', stylesheetProps);
      resource.instance = instance;
    }

    if (state.stylesheets === null) {
      state.stylesheets = new Map();
    }
    state.stylesheets.set(resource, hoistableRoot);

    const preloadEl = resource.state.preload;
    if (preloadEl && (resource.state.loading & Settled) === NotLoaded) {
      state.count++;
      const ping = onUnsuspend.bind(state);
      preloadEl.addEventListener('load', ping);
      preloadEl.addEventListener('error', ping);
    }
  }
}

export function waitForCommitToBeReady(): null | (Function => Function) {
  if (suspendedState === null) {
    throw new Error(
      'Internal React Error: suspendedState null when it was expected to exists. Please report this as a React bug.',
    );
  }

  const state = suspendedState;

  if (state.stylesheets && state.count === 0) {
    // We are not currently blocked but we have not inserted all stylesheets.
    // If this insertion happens and loads or errors synchronously then we can
    // avoid suspending the commit. To do this we check the count again immediately after
    insertSuspendedStylesheets(state, state.stylesheets);
  }

  // We need to check the count again because the inserted stylesheets may have led to new
  // tasks to wait on.
  if (state.count > 0) {
    return commit => {
      // We almost never want to show content before its styles have loaded. But
      // eventually we will give up and allow unstyled content. So this number is
      // somewhat arbitrary — big enough that you'd only reach it under
      // extreme circumstances.
      // TODO: Figure out what the browser engines do during initial page load and
      // consider aligning our behavior with that.
      const stylesheetTimer = setTimeout(() => {
        if (state.stylesheets) {
          insertSuspendedStylesheets(state, state.stylesheets);
        }
        if (state.unsuspend) {
          const unsuspend = state.unsuspend;
          state.unsuspend = null;
          unsuspend();
        }
      }, 60000); // one minute

      state.unsuspend = commit;

      return () => {
        state.unsuspend = null;
        clearTimeout(stylesheetTimer);
      };
    };
  }
  return null;
}

function onUnsuspend(this: SuspendedState) {
  this.count--;
  if (this.count === 0) {
    if (this.stylesheets) {
      // If we haven't actually inserted the stylesheets yet we need to do so now before starting the commit.
      // The reason we do this after everything else has finished is because we want to have all the stylesheets
      // load synchronously right before mutating. Ideally the new styles will cause a single recalc only on the
      // new tree. When we filled up stylesheets we only inlcuded stylesheets with matching media attributes so we
      // wait for them to load before actually continuing. We expect this to increase the count above zero
      insertSuspendedStylesheets(this, this.stylesheets);
    } else if (this.unsuspend) {
      const unsuspend = this.unsuspend;
      this.unsuspend = null;
      unsuspend();
    }
  }
}

// This is typecast to non-null because it will always be set before read.
// it is important that this not be used except when the stack guarantees it exists.
// Currentlyt his is only during insertSuspendedStylesheet.
let precedencesByRoot: Map<HoistableRoot, Map<string, Instance>> = (null: any);

function insertSuspendedStylesheets(
  state: SuspendedState,
  resources: Map<StylesheetResource, HoistableRoot>,
): void {
  // We need to clear this out so we don't try to reinsert after the stylesheets have loaded
  state.stylesheets = null;

  if (state.unsuspend === null) {
    // The suspended commit was cancelled. We don't need to insert any stylesheets.
    return;
  }

  // Temporarily increment count. we don't want any synchronously loaded stylesheets to try to unsuspend
  // before we finish inserting all stylesheets.
  state.count++;

  precedencesByRoot = new Map();
  resources.forEach(insertStylesheetIntoRoot, state);
  precedencesByRoot = (null: any);

  // We can remove our temporary count and if we're still at zero we can unsuspend.
  // If we are in the synchronous phase before deciding if the commit should suspend and this
  // ends up hitting the unsuspend path it will just invoke the noop unsuspend.
  onUnsuspend.call(state);
}

function insertStylesheetIntoRoot(
  this: SuspendedState,
  root: HoistableRoot,
  resource: StylesheetResource,
  map: Map<StylesheetResource, HoistableRoot>,
) {
  if (resource.state.loading & Inserted) {
    // This resource was inserted by another root committing. we don't need to insert it again
    return;
  }

  let last;
  let precedences = precedencesByRoot.get(root);
  if (!precedences) {
    precedences = new Map();
    precedencesByRoot.set(root, precedences);
    const nodes = root.querySelectorAll(
      'link[data-precedence],style[data-precedence]',
    );
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (
        node.nodeName === 'link' ||
        // We omit style tags with media="not all" because they are not in the right position
        // and will be hoisted by the Fizz runtime imminently.
        node.getAttribute('media') !== 'not all'
      ) {
        precedences.set('p' + node.dataset.precedence, node);
        last = node;
      }
    }
    if (last) {
      precedences.set('last', last);
    }
  } else {
    last = precedences.get('last');
  }

  // We only call this after we have constructed an instance so we assume it here
  const instance: HTMLLinkElement = (resource.instance: any);
  // We will always have a precedence for stylesheet instances
  const precedence: string = (instance.getAttribute('data-precedence'): any);

  const prior = precedences.get('p' + precedence) || last;
  if (prior === last) {
    precedences.set('last', instance);
  }
  precedences.set(precedence, instance);

  this.count++;
  const onComplete = onUnsuspend.bind(this);
  instance.addEventListener('load', onComplete);
  instance.addEventListener('error', onComplete);

  if (prior) {
    (prior.parentNode: any).insertBefore(instance, prior.nextSibling);
  } else {
    const parent =
      root.nodeType === DOCUMENT_NODE
        ? ((((root: any): Document).head: any): Element)
        : ((root: any): ShadowRoot);
    parent.insertBefore(instance, parent.firstChild);
  }
  resource.state.loading |= Inserted;
}
