/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getHostComponentInputProps,
  initHostComponentInputWrapperState,
} from './controlled/ReactFireInput';
import {
  getHostComponentOptionProps,
  validateHostComponentOptionProps,
} from './controlled/ReactFireOption';
import {
  getHostComponentSelectProps,
  initHostComponentSelectWrapperState,
} from './controlled/ReactFireSelect';
import {
  getHostComponentTextareaProps,
  initHostComponentTextareaWrapperState,
} from './controlled/ReactFireTextarea';
import {
  ERROR,
  INVALID,
  LOAD,
  RESET,
  SUBMIT,
  TOGGLE,
} from '../events/ReactFireEventTypes';
import {ensureListeningTo, trapBubbledEvent} from '../events/ReactFireEvents';
import {mediaEventTypesArr} from '../events/ReactFireEventTypes';

export const specialHostComponentTypes = {
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
  trapBubbledEvent(INVALID, domNode);
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
  trapBubbledEvent(INVALID, domNode);
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
  trapBubbledEvent(INVALID, domNode);
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
  trapBubbledEvent(TOGGLE, domNode);
  return props;
}

function typeIsForm(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent(RESET, domNode);
  trapBubbledEvent(SUBMIT, domNode);
  return props;
}

function typeIsImageOrLink(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent(ERROR, domNode);
  trapBubbledEvent(LOAD, domNode);
  return props;
}

function typeIsIframeOrObject(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent(LOAD, domNode);
  return props;
}

function typeIsVideoOrAudio(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  // Create listener for each media event
  for (let i = 0; i < mediaEventTypesArr.length; i++) {
    // TODO should this be bubbled still? I think it should be captured instead...
    trapBubbledEvent(mediaEventTypesArr[i], domNode);
  }
  return props;
}

function typeIsSource(
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
) {
  trapBubbledEvent(ERROR, domNode);
  return props;
}
