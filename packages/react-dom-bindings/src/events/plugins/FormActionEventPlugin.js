/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from '../PluginModuleType';
import type {DOMEventName} from '../DOMEventNames';
import type {DispatchQueue} from '../DOMPluginEventSystem';
import type {EventSystemFlags} from '../EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import {getFiberCurrentPropsFromNode} from '../../client/ReactDOMComponentTree';

import {SyntheticEvent} from '../SyntheticEvent';

/**
 * This plugin invokes action functions on forms, inputs and buttons if
 * the form doesn't prevent default.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
) {
  if (domEventName !== 'submit') {
    return;
  }
  if (!targetInst || targetInst.stateNode !== nativeEventTarget) {
    // If we're inside a parent root that itself is a parent of this root, then
    // its deepest target won't be the actual form that's being submitted.
    return;
  }
  const form: HTMLFormElement = (nativeEventTarget: any);
  let action = (getFiberCurrentPropsFromNode(form): any).action;
  const submitter: null | HTMLInputElement | HTMLButtonElement =
    (nativeEvent: any).submitter;
  let submitterAction;
  if (submitter) {
    const submitterProps = getFiberCurrentPropsFromNode(submitter);
    submitterAction = submitterProps
      ? (submitterProps: any).formAction
      : submitter.getAttribute('formAction');
    if (submitterAction != null) {
      // The submitter overrides the form action.
      action = submitterAction;
    }
  }

  if (typeof action !== 'function') {
    return;
  }

  const event = new SyntheticEvent(
    'action',
    'action',
    null,
    nativeEvent,
    nativeEventTarget,
  );

  function submitForm() {
    if (nativeEvent.defaultPrevented) {
      // We let earlier events to prevent the action from submitting.
      return;
    }
    // Prevent native navigation.
    event.preventDefault();
    let formData;
    if (submitter) {
      // The submitter's value should be included in the FormData.
      // It should be in the document order in the form.
      // Since the FormData constructor invokes the formdata event it also
      // needs to be available before that happens so after construction it's too
      // late. The easiest way to do this is to switch the form field to hidden,
      // which is always included, and then back again. This does means that this
      // is observable from the formdata event though.
      // TODO: This tricky doesn't work on button elements. Consider inserting
      // a fake node instead for that case.
      // TODO: FormData takes a second argument that it's the submitter but this
      // is fairly new so not all browsers support it yet. Switch to that technique
      // when available.
      const type = submitter.type;
      submitter.type = 'hidden';
      formData = new FormData(form);
      submitter.type = type;
    } else {
      formData = new FormData(form);
    }
    // TODO: Deal with errors and pending state.
    action(formData);
  }

  dispatchQueue.push({
    event,
    listeners: [
      {
        instance: null,
        listener: submitForm,
        currentTarget: form,
      },
    ],
  });
}

export {extractEvents};
