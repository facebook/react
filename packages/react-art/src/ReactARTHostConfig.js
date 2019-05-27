/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Transform from 'art/core/transform';
import Mode from 'art/modes/current';
import * as Scheduler from 'scheduler';
import invariant from 'shared/invariant';

import {TYPES, EVENT_TYPES, childrenAsString} from './ReactARTInternals';
import type {ReactEventComponentInstance} from 'shared/ReactTypes';

// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
const {
  unstable_now: now,
  unstable_scheduleCallback: scheduleDeferredCallback,
  unstable_shouldYield: shouldYield,
  unstable_cancelCallback: cancelDeferredCallback,
} = Scheduler;

export {now, scheduleDeferredCallback, shouldYield, cancelDeferredCallback};

const pooledTransform = new Transform();

const NO_CONTEXT = {};
const UPDATE_SIGNAL = {};
if (__DEV__) {
  Object.freeze(NO_CONTEXT);
  Object.freeze(UPDATE_SIGNAL);
}

/** Helper Methods */

function addEventListeners(instance, type, listener) {
  // We need to explicitly unregister before unmount.
  // For this reason we need to track subscriptions.
  if (!instance._listeners) {
    instance._listeners = {};
    instance._subscriptions = {};
  }

  instance._listeners[type] = listener;

  if (listener) {
    if (!instance._subscriptions[type]) {
      instance._subscriptions[type] = instance.subscribe(
        type,
        createEventHandler(instance),
        instance,
      );
    }
  } else {
    if (instance._subscriptions[type]) {
      instance._subscriptions[type]();
      delete instance._subscriptions[type];
    }
  }
}

function createEventHandler(instance) {
  return function handleEvent(event) {
    const listener = instance._listeners[event.type];

    if (!listener) {
      // Noop
    } else if (typeof listener === 'function') {
      listener.call(instance, event);
    } else if (listener.handleEvent) {
      listener.handleEvent(event);
    }
  };
}

function destroyEventListeners(instance) {
  if (instance._subscriptions) {
    for (let type in instance._subscriptions) {
      instance._subscriptions[type]();
    }
  }

  instance._subscriptions = null;
  instance._listeners = null;
}

function getScaleX(props) {
  if (props.scaleX != null) {
    return props.scaleX;
  } else if (props.scale != null) {
    return props.scale;
  } else {
    return 1;
  }
}

function getScaleY(props) {
  if (props.scaleY != null) {
    return props.scaleY;
  } else if (props.scale != null) {
    return props.scale;
  } else {
    return 1;
  }
}

function isSameFont(oldFont, newFont) {
  if (oldFont === newFont) {
    return true;
  } else if (typeof newFont === 'string' || typeof oldFont === 'string') {
    return false;
  } else {
    return (
      newFont.fontSize === oldFont.fontSize &&
      newFont.fontStyle === oldFont.fontStyle &&
      newFont.fontVariant === oldFont.fontVariant &&
      newFont.fontWeight === oldFont.fontWeight &&
      newFont.fontFamily === oldFont.fontFamily
    );
  }
}

/** Render Methods */

function applyClippingRectangleProps(instance, props, prevProps = {}) {
  applyNodeProps(instance, props, prevProps);

  instance.width = props.width;
  instance.height = props.height;
}

function applyGroupProps(instance, props, prevProps = {}) {
  applyNodeProps(instance, props, prevProps);

  instance.width = props.width;
  instance.height = props.height;
}

function applyNodeProps(instance, props, prevProps = {}) {
  const scaleX = getScaleX(props);
  const scaleY = getScaleY(props);

  pooledTransform
    .transformTo(1, 0, 0, 1, 0, 0)
    .move(props.x || 0, props.y || 0)
    .rotate(props.rotation || 0, props.originX, props.originY)
    .scale(scaleX, scaleY, props.originX, props.originY);

  if (props.transform != null) {
    pooledTransform.transform(props.transform);
  }

  if (
    instance.xx !== pooledTransform.xx ||
    instance.yx !== pooledTransform.yx ||
    instance.xy !== pooledTransform.xy ||
    instance.yy !== pooledTransform.yy ||
    instance.x !== pooledTransform.x ||
    instance.y !== pooledTransform.y
  ) {
    instance.transformTo(pooledTransform);
  }

  if (props.cursor !== prevProps.cursor || props.title !== prevProps.title) {
    instance.indicate(props.cursor, props.title);
  }

  if (instance.blend && props.opacity !== prevProps.opacity) {
    instance.blend(props.opacity == null ? 1 : props.opacity);
  }

  if (props.visible !== prevProps.visible) {
    if (props.visible == null || props.visible) {
      instance.show();
    } else {
      instance.hide();
    }
  }

  for (let type in EVENT_TYPES) {
    addEventListeners(instance, EVENT_TYPES[type], props[type]);
  }
}

function applyRenderableNodeProps(instance, props, prevProps = {}) {
  applyNodeProps(instance, props, prevProps);

  if (prevProps.fill !== props.fill) {
    if (props.fill && props.fill.applyFill) {
      props.fill.applyFill(instance);
    } else {
      instance.fill(props.fill);
    }
  }
  if (
    prevProps.stroke !== props.stroke ||
    prevProps.strokeWidth !== props.strokeWidth ||
    prevProps.strokeCap !== props.strokeCap ||
    prevProps.strokeJoin !== props.strokeJoin ||
    // TODO: Consider deep check of stokeDash; may benefit VML in IE.
    prevProps.strokeDash !== props.strokeDash
  ) {
    instance.stroke(
      props.stroke,
      props.strokeWidth,
      props.strokeCap,
      props.strokeJoin,
      props.strokeDash,
    );
  }
}

function applyShapeProps(instance, props, prevProps = {}) {
  applyRenderableNodeProps(instance, props, prevProps);

  const path = props.d || childrenAsString(props.children);

  const prevDelta = instance._prevDelta;
  const prevPath = instance._prevPath;

  if (
    path !== prevPath ||
    path.delta !== prevDelta ||
    prevProps.height !== props.height ||
    prevProps.width !== props.width
  ) {
    instance.draw(path, props.width, props.height);

    instance._prevDelta = path.delta;
    instance._prevPath = path;
  }
}

function applyTextProps(instance, props, prevProps = {}) {
  applyRenderableNodeProps(instance, props, prevProps);

  const string = props.children;

  if (
    instance._currentString !== string ||
    !isSameFont(props.font, prevProps.font) ||
    props.alignment !== prevProps.alignment ||
    props.path !== prevProps.path
  ) {
    instance.draw(string, props.font, props.alignment, props.path);

    instance._currentString = string;
  }
}

export * from 'shared/HostConfigWithNoPersistence';
export * from 'shared/HostConfigWithNoHydration';

export function appendInitialChild(parentInstance, child) {
  if (typeof child === 'string') {
    // Noop for string children of Text (eg <Text>{'foo'}{'bar'}</Text>)
    invariant(false, 'Text children should already be flattened.');
    return;
  }

  child.inject(parentInstance);
}

export function createInstance(type, props, internalInstanceHandle) {
  let instance;

  switch (type) {
    case TYPES.CLIPPING_RECTANGLE:
      instance = Mode.ClippingRectangle();
      instance._applyProps = applyClippingRectangleProps;
      break;
    case TYPES.GROUP:
      instance = Mode.Group();
      instance._applyProps = applyGroupProps;
      break;
    case TYPES.SHAPE:
      instance = Mode.Shape();
      instance._applyProps = applyShapeProps;
      break;
    case TYPES.TEXT:
      instance = Mode.Text(
        props.children,
        props.font,
        props.alignment,
        props.path,
      );
      instance._applyProps = applyTextProps;
      break;
  }

  invariant(instance, 'ReactART does not support the type "%s"', type);

  instance._applyProps(instance, props);

  return instance;
}

export function createTextInstance(
  text,
  rootContainerInstance,
  internalInstanceHandle,
) {
  return text;
}

export function finalizeInitialChildren(domElement, type, props) {
  return false;
}

export function getPublicInstance(instance) {
  return instance;
}

export function prepareForCommit() {
  // Noop
}

export function prepareUpdate(domElement, type, oldProps, newProps) {
  return UPDATE_SIGNAL;
}

export function resetAfterCommit() {
  // Noop
}

export function resetTextContent(domElement) {
  // Noop
}

export function shouldDeprioritizeSubtree(type, props) {
  return false;
}

export function getRootHostContext() {
  return NO_CONTEXT;
}

export function getChildHostContext() {
  return NO_CONTEXT;
}

export function getChildHostContextForEventComponent() {
  return NO_CONTEXT;
}

export function getChildHostContextForEventTarget() {
  return NO_CONTEXT;
}

export const scheduleTimeout = setTimeout;
export const cancelTimeout = clearTimeout;
export const noTimeout = -1;

export function shouldSetTextContent(type, props) {
  return (
    typeof props.children === 'string' || typeof props.children === 'number'
  );
}

// The ART renderer is secondary to the React DOM renderer.
export const isPrimaryRenderer = false;

export const supportsMutation = true;

export function appendChild(parentInstance, child) {
  if (child.parentNode === parentInstance) {
    child.eject();
  }
  child.inject(parentInstance);
}

export function appendChildToContainer(parentInstance, child) {
  if (child.parentNode === parentInstance) {
    child.eject();
  }
  child.inject(parentInstance);
}

export function insertBefore(parentInstance, child, beforeChild) {
  invariant(
    child !== beforeChild,
    'ReactART: Can not insert node before itself',
  );
  child.injectBefore(beforeChild);
}

export function insertInContainerBefore(parentInstance, child, beforeChild) {
  invariant(
    child !== beforeChild,
    'ReactART: Can not insert node before itself',
  );
  child.injectBefore(beforeChild);
}

export function removeChild(parentInstance, child) {
  destroyEventListeners(child);
  child.eject();
}

export function removeChildFromContainer(parentInstance, child) {
  destroyEventListeners(child);
  child.eject();
}

export function commitTextUpdate(textInstance, oldText, newText) {
  // Noop
}

export function commitMount(instance, type, newProps) {
  // Noop
}

export function commitUpdate(
  instance,
  updatePayload,
  type,
  oldProps,
  newProps,
) {
  instance._applyProps(instance, newProps, oldProps);
}

export function hideInstance(instance) {
  instance.hide();
}

export function hideTextInstance(textInstance) {
  // Noop
}

export function unhideInstance(instance, props) {
  if (props.visible == null || props.visible) {
    instance.show();
  }
}

export function unhideTextInstance(textInstance, text): void {
  // Noop
}

export function mountEventComponent(
  eventComponentInstance: ReactEventComponentInstance,
) {
  throw new Error('Not yet implemented.');
}

export function updateEventComponent(
  eventComponentInstance: ReactEventComponentInstance,
) {
  throw new Error('Not yet implemented.');
}

export function unmountEventComponent(
  eventComponentInstance: ReactEventComponentInstance,
): void {
  throw new Error('Not yet implemented.');
}

export function getEventTargetChildElement(
  type: Symbol | number,
  props: Props,
): null {
  throw new Error('Not yet implemented.');
}

export function handleEventTarget(
  type: Symbol | number,
  props: Props,
  rootContainerInstance: Container,
  internalInstanceHandle: Object,
): boolean {
  throw new Error('Not yet implemented.');
}

export function commitEventTarget(
  type: Symbol | number,
  props: Props,
  instance: Instance,
  parentInstance: Instance,
): void {
  throw new Error('Not yet implemented.');
}
