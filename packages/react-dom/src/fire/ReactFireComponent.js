/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  createElement,
  isCustomComponent,
  isPropAnEvent,
} from './ReactFireUtils';
import {
  AUTOFOCUS,
  CHILDREN,
  DANGEROUSLY_SET_INNER_HTML,
  HTML,
  STYLE,
  SUPPRESS_CONTENT_EDITABLE_WARNING,
  SUPPRESS_HYDRATION_WARNING,
} from './ReactFireDOMConfig';
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
  getHostTextareaSelectProps,
  initHostComponentTextareaWrapperState,
} from './controlled/ReactFireTextarea';
import {
  ensureListeningTo,
  trapBubbledEvent,
  trapClickOnNonInteractiveElement,
} from './ReactFireEvents';
import {track} from './controlled/ReactFireValueTracking';
import {
  assertValidProps,
  validateARIAProperties,
  validateInputProperties,
  validateShorthandPropertyCollisionInDev,
  validateUnknownProperties,
} from './ReactFireValidation';
import {
  diffHydratedDOMElementProperties,
  setDOMElementProperties,
  updateDOMElementProperties,
} from './ReactFireComponentProperties';

import warning from 'shared/warning';
import {getCurrentFiberOwnerNameInDevOrNull} from 'react-reconciler/src/ReactCurrentFiber';

let didWarnShadyDOM = false;
let validatePropertiesInDevelopment;
let warnForInvalidEventListener;

if (__DEV__) {
  validatePropertiesInDevelopment = function(type, props) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props);
  };

  warnForInvalidEventListener = function(registrationName, listener) {
    if (listener === false) {
      warning(
        false,
        'Expected `%s` listener to be a function, instead got `false`.\n\n' +
          'If you used to conditionally omit it with %s={condition && value}, ' +
          'pass %s={condition ? value : undefined} instead.',
        registrationName,
        registrationName,
        registrationName,
      );
    } else {
      warning(
        false,
        'Expected `%s` listener to be a function, instead got a value of `%s` type.',
        registrationName,
        typeof listener,
      );
    }
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
  props = getHostTextareaSelectProps(domNode, props);
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
    ? hostContext.namespace
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
  rawProps: object,
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
      lastProps = getHostTextareaSelectProps(domNode, lastRawProps);
      nextProps = getHostTextareaSelectProps(domNode, nextRawProps);
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

  assertValidProps(type, nextProps);

  let propName;
  let styleName;
  let styleUpdates = null;
  for (propName in lastProps) {
    if (
      nextProps.hasOwnProperty(propName) ||
      !lastProps.hasOwnProperty(propName) ||
      lastProps[propName] == null
    ) {
      continue;
    }
    if (propName === STYLE) {
      const lastStyle = lastProps[propName];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = '';
        }
      }
    } else if (
      propName === DANGEROUSLY_SET_INNER_HTML ||
      propName === CHILDREN
    ) {
      // Noop. This is handled by the clear text mechanism.
    } else if (
      propName === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propName === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } else if (propName === AUTOFOCUS) {
      // Noop. It doesn't work on updates anyway.
    } else {
      // For all other deleted properties we add it to the queue. We use
      // the whitelist in the commit phase instead.
      (updatePayload = updatePayload || []).push(propName, null);
    }
  }
  for (propName in nextProps) {
    const nextProp = nextProps[propName];
    const lastProp = lastProps != null ? lastProps[propName] : undefined;
    if (
      !nextProps.hasOwnProperty(propName) ||
      nextProp === lastProp ||
      (nextProp == null && lastProp == null)
    ) {
      continue;
    }
    if (propName === STYLE) {
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
          updatePayload.push(propName, styleUpdates);
        }
        styleUpdates = nextProp;
      }
    } else if (propName === DANGEROUSLY_SET_INNER_HTML) {
      const nextHtml = nextProp ? nextProp[HTML] : undefined;
      const lastHtml = lastProp ? lastProp[HTML] : undefined;
      if (nextHtml != null) {
        if (lastHtml !== nextHtml) {
          (updatePayload = updatePayload || []).push(propName, '' + nextHtml);
        }
      } else {
        // TODO: It might be too late to clear this if we have children
        // inserted already.
      }
    } else if (propName === CHILDREN) {
      if (
        lastProp !== nextProp &&
        (typeof nextProp === 'string' || typeof nextProp === 'number')
      ) {
        (updatePayload = updatePayload || []).push(propName, '' + nextProp);
      }
    } else if (
      propName === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propName === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } else {
      if (nextProp != null && isPropAnEvent(propName)) {
        if (__DEV__ && typeof nextProp !== 'function') {
          warnForInvalidEventListener(propName, nextProp);
        }
        ensureListeningTo(rootContainerElement, propName);
      }
      // For any other property we always add it to the queue and then we
      // filter it out using the whitelist during the commit.
      (updatePayload = updatePayload || []).push(propName, nextProp);
    }
  }
  if (styleUpdates) {
    if (__DEV__) {
      validateShorthandPropertyCollisionInDev(styleUpdates, nextProps[STYLE]);
    }
    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }

  return updatePayload;
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
  let isCustomComponentTag;

  if (__DEV__) {
    isCustomComponentTag = isCustomComponent(type, rawProps);
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
