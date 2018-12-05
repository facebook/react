/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createElement, isCustomComponent} from './ReactFireUtils';
import {mediaEventTypes} from './ReactFireEventTypes';
import {
  applyHostComponentInputMountWrapper,
  updateWrapper as applyHostComponentInputUpdateWrapper,
  getHostComponentInputProps,
  initHostComponentInputWrapperState,
  updateChecked,
} from './controlled/ReactFireInput';
import {
  applyHostComponentOptionMountWrapper,
  getHostComponentOptionProps,
  validateHostComponentOptionProps,
} from './controlled/ReactFireOption';
import {
  applyHostComponentSelectMountWrapper,
  applyHostComponentSelectUpdateWrapper,
  getHostComponentSelectProps,
  initHostComponentSelectWrapperState,
} from './controlled/ReactFireSelect';
import {
  applyHostComponentTextareaMountWrapper,
  updateWrapper as applyHostComponentTextareaUpdateWrapper,
  getHostComponentTextareaProps,
  initHostComponentTextareaWrapperState,
} from './controlled/ReactFireTextarea';
import {
  ensureListeningTo,
  trapBubbledEvent,
  trapClickOnNonInteractiveElement,
} from './ReactFireEvents';
import {track} from './controlled/ReactFireValueTracking';
import {
  validateARIAProperties,
  validateInputProperties,
  validateUnknownProperties,
} from './ReactFireValidation';
import {
  diffDOMElementProperties,
  diffHydratedDOMElementProperties,
  setDOMElementProperties,
  updateDOMElementProperties,
} from './ReactFireComponentProperties';

import type {
  HostContext,
  HostContextDev,
  HostContextProd,
} from './ReactFireHostConfig';

import warning from 'shared/warning';
import {getCurrentFiberOwnerNameInDevOrNull} from 'react-reconciler/src/ReactCurrentFiber';

let didWarnShadyDOM = false;
let validatePropertiesInDevelopment;

if (__DEV__) {
  validatePropertiesInDevelopment = function(type, props) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props);
  };
}

const specialHostComponentTypes = {
  audio: typeIsVideoOrAudio,
  details: typeIsDetails,
  form: typeIsForm,
  iframe: typeIsIframeOrObject,
  image: typeIsImageOrLink,
  img: typeIsImageOrLink,
  input: typeIsInput,
  link: typeIsImageOrLink,
  object: typeIsIframeOrObject,
  option: typeIsOption,
  select: typeIsSelect,
  source: typeIsSource,
  textarea: typeIsTextarea,
  video: typeIsVideoOrAudio,
};

function typeIsTextarea(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  initHostComponentTextareaWrapperState(domNode, props);
  props = getHostComponentTextareaProps(domNode, props);
  trapBubbledEvent('invalid', domNode);
  // For controlled components we always need to ensure we're listening
  // to onChange. Even if there is no listener.
  ensureListeningTo(rootContainerElement, 'onChange');
  return props;
}

function typeIsSelect(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  initHostComponentSelectWrapperState(domNode, props);
  props = getHostComponentSelectProps(domNode, props);
  trapBubbledEvent('invalid', domNode);
  // For controlled components we always need to ensure we're listening
  // to onChange. Even if there is no listener.
  ensureListeningTo(rootContainerElement, 'onChange');
  return props;
}

function typeIsOption(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  validateHostComponentOptionProps(domNode, props);
  return getHostComponentOptionProps(domNode, props);
}

function typeIsInput(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  initHostComponentInputWrapperState(domNode, props);
  props = getHostComponentInputProps(domNode, props);
  trapBubbledEvent('invalid', domNode);
  // For controlled components we always need to ensure we're listening
  // to onChange. Even if there is no listener.
  ensureListeningTo(rootContainerElement, 'onChange');
  return props;
}

function typeIsDetails(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent('toggle', domNode);
  return props;
}

function typeIsForm(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent('reset', domNode);
  trapBubbledEvent('submit', domNode);
  return props;
}

function typeIsImageOrLink(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent('error', domNode);
  trapBubbledEvent('load', domNode);
  return props;
}

function typeIsIframeOrObject(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent('load', domNode);
  return props;
}

function typeIsVideoOrAudio(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  // Create listener for each media event
  for (let i = 0; i < mediaEventTypes.length; i++) {
    // TODO should this be bubbled still? I think it should be captured instead...
    trapBubbledEvent(mediaEventTypes[i], domNode);
  }
  return props;
}

function typeIsSource(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent('error', domNode);
  return props;
}

export function createHostComponent(
  type: string,
  props: Object,
  rootContainerInstance: Element | Document,
  hostContext: HostContext,
) {
  const parentNamespace = __DEV__
    ? ((hostContext: any): HostContextDev).namespace
    : ((hostContext: any): HostContextProd);
  const domElement = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  return domElement;
}

export function setHostComponentInitialProps(
  type: string,
  rawProps: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
  hostContext: HostContext,
) {
  const isCustomComponentTag = isCustomComponent(type, rawProps);
  if (__DEV__) {
    validatePropertiesInDevelopment(type, rawProps);
    if (isCustomComponentTag && !didWarnShadyDOM && (domNode: any).shadyRoot) {
      warning(
        false,
        '%s is using shady DOM. Using shady DOM with React can ' +
          'cause things to break subtly.',
        getCurrentFiberOwnerNameInDevOrNull() || 'A component',
      );
      didWarnShadyDOM = true;
    }
  }
  const specicalHostComponentTypeFunc = specialHostComponentTypes.hasOwnProperty(
    type,
  )
    ? specialHostComponentTypes[type]
    : null;
  let props = rawProps;

  if (specicalHostComponentTypeFunc !== null) {
    props = specicalHostComponentTypeFunc(
      rawProps,
      domNode,
      rootContainerElement,
    );
  }

  setDOMElementProperties(
    type,
    props,
    domNode,
    rootContainerElement,
    isCustomComponentTag,
  );

  if (specicalHostComponentTypeFunc !== null) {
    switch (type) {
      case 'input':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track((domNode: any));
        applyHostComponentInputMountWrapper(domNode, rawProps, false);
        break;
      case 'textarea':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track((domNode: any));
        applyHostComponentTextareaMountWrapper(domNode, rawProps);
        break;
      case 'option':
        applyHostComponentOptionMountWrapper(domNode, rawProps);
        break;
      case 'select':
        applyHostComponentSelectMountWrapper(domNode, rawProps);
        break;
      default:
    }
  } else {
    if (typeof props.onClick === 'function') {
      // TODO: This cast may not be sound for SVG, MathML or custom elements.
      trapClickOnNonInteractiveElement(((domNode: any): HTMLElement));
    }
  }
}

// Calculate the diff between the two objects.
export function diffHostComponentProperties(
  domNode: Element,
  type: string,
  lastRawProps: Object,
  nextRawProps: Object,
  rootContainerElement: Element | Document,
): null | Array<mixed> {
  if (__DEV__) {
    validatePropertiesInDevelopment(type, nextRawProps);
  }

  let updatePayload: null | Array<any> = null;
  let lastProps: Object;
  let nextProps: Object;
  switch (type) {
    case 'input':
      lastProps = getHostComponentInputProps(domNode, lastRawProps);
      nextProps = getHostComponentInputProps(domNode, nextRawProps);
      updatePayload = [];
      break;
    case 'option':
      lastProps = getHostComponentOptionProps(domNode, lastRawProps);
      nextProps = getHostComponentOptionProps(domNode, nextRawProps);
      updatePayload = [];
      break;
    case 'select':
      lastProps = getHostComponentSelectProps(domNode, lastRawProps);
      nextProps = getHostComponentSelectProps(domNode, nextRawProps);
      updatePayload = [];
      break;
    case 'textarea':
      lastProps = getHostComponentTextareaProps(domNode, lastRawProps);
      nextProps = getHostComponentTextareaProps(domNode, nextRawProps);
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
        trapClickOnNonInteractiveElement(((domNode: any): HTMLElement));
      }
      break;
  }

  return diffDOMElementProperties(
    domNode,
    type,
    updatePayload,
    lastProps,
    nextProps,
    rootContainerElement,
  );
}

export function updateHostComponentProperties(
  domNode: Element,
  updatePayload: Array<any>,
  type: string,
  lastRawProps: Object,
  nextRawProps: Object,
) {
  // Update checked *before* name.
  // In the middle of an update, it is possible to have multiple checked.
  // When a checked radio tries to change name, browser makes another radio's checked false.
  if (
    type === 'input' &&
    nextRawProps.type === 'radio' &&
    nextRawProps.name != null
  ) {
    updateChecked(domNode, nextRawProps);
  }

  const wasCustomComponentTag = isCustomComponent(type, lastRawProps);
  const isCustomComponentTag = isCustomComponent(type, nextRawProps);

  // Apply the diff.
  updateDOMElementProperties(
    domNode,
    lastRawProps,
    updatePayload,
    wasCustomComponentTag,
    isCustomComponentTag,
  );

  // TODO: Ensure that an update gets scheduled if any of the special props
  // changed.
  switch (type) {
    case 'input':
      // Update the wrapper around inputs *after* updating props. This has to
      // happen after `updateDOMProperties`. Otherwise HTML5 input validations
      // raise warnings and prevent the new value from being assigned.
      applyHostComponentInputUpdateWrapper(domNode, nextRawProps);
      break;
    case 'textarea':
      applyHostComponentTextareaUpdateWrapper(domNode, nextRawProps);
      break;
    case 'select':
      // <select> value update needs to occur after <option> children
      // reconciliation
      applyHostComponentSelectUpdateWrapper(domNode, nextRawProps);
      break;
  }
}

export function diffHydratedHostComponentProperties(
  domNode: Element,
  type: string,
  rawProps: Object,
  parentNamespace: string,
  rootContainerElement: Element | Document,
): null | Array<mixed> {
  const isCustomComponentTag = isCustomComponent(type, rawProps);

  if (__DEV__) {
    validatePropertiesInDevelopment(type, rawProps);
    if (isCustomComponentTag && !didWarnShadyDOM && (domNode: any).shadyRoot) {
      warning(
        false,
        '%s is using shady DOM. Using shady DOM with React can ' +
          'cause things to break subtly.',
        getCurrentFiberOwnerNameInDevOrNull() || 'A component',
      );
      didWarnShadyDOM = true;
    }
  }

  const specicalHostComponentTypeFunc = specialHostComponentTypes.hasOwnProperty(
    type,
  )
    ? specialHostComponentTypes[type]
    : null;

  if (specicalHostComponentTypeFunc !== null) {
    specicalHostComponentTypeFunc(rawProps, domNode, rootContainerElement);
  }

  const updatePayload = diffHydratedDOMElementProperties(
    type,
    rawProps,
    domNode,
    rootContainerElement,
    isCustomComponentTag,
    parentNamespace,
  );

  if (specicalHostComponentTypeFunc !== null) {
    switch (type) {
      case 'input':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track((domNode: any));
        applyHostComponentInputMountWrapper(domNode, rawProps, true);
        break;
      case 'textarea':
        // TODO: Make sure we check if this is still unmounted or do any clean
        // up necessary since we never stop tracking anymore.
        track((domNode: any));
        applyHostComponentTextareaMountWrapper(domNode, rawProps);
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
    }
  } else {
    if (typeof rawProps.onClick === 'function') {
      // TODO: This cast may not be sound for SVG, MathML or custom elements.
      trapClickOnNonInteractiveElement(((domNode: any): HTMLElement));
    }
  }

  return updatePayload;
}
