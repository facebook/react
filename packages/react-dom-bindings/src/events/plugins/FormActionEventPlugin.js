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
import type {FormStatus} from 'react-dom-bindings/src/shared/ReactDOMFormActions';

import {getFiberCurrentPropsFromNode} from '../../client/ReactDOMComponentTree';
import {startHostTransition} from 'react-reconciler/src/ReactFiberReconciler';

import {SyntheticEvent} from '../SyntheticEvent';

/**
 * This plugin invokes action functions on forms, inputs and buttons if
 * the form doesn't prevent default.
 */
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  maybeTargetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
) {
  if (domEventName !== 'submit') {
    return;
  }
  if (!maybeTargetInst || maybeTargetInst.stateNode !== nativeEventTarget) {
    // If we're inside a parent root that itself is a parent of this root, then
    // its deepest target won't be the actual form that's being submitted.
    return;
  }
  const formInst = maybeTargetInst;
  const form: HTMLFormElement = (nativeEventTarget: any);
  let action = (getFiberCurrentPropsFromNode(form): any).action;
  let submitter: null | HTMLInputElement | HTMLButtonElement =
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
      // If the action is a function, we don't want to pass its name
      // value to the FormData since it's controlled by the server.
      submitter = null;
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
      // late. We use a temporary fake node for the duration of this event.
      // TODO: FormData takes a second argument that it's the submitter but this
      // is fairly new so not all browsers support it yet. Switch to that technique
      // when available.
      const temp = submitter.ownerDocument.createElement('input');
      temp.name = submitter.name;
      temp.value = submitter.value;
      if (form.id) {
        temp.setAttribute('form', form.id);
      }
      (submitter.parentNode: any).insertBefore(temp, submitter);
      formData = new FormData(form);
      (temp.parentNode: any).removeChild(temp);
    } else {
      formData = new FormData(form);
    }

    const pendingState: FormStatus = {
      pending: true,
      data: formData,
      method: form.method,
      action: action,
    };
    if (__DEV__) {
      Object.freeze(pendingState);
    }
    startHostTransition(formInst, pendingState, action, formData);
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

export function dispatchReplayedFormAction(
  formInst: Fiber,
  form: HTMLFormElement,
  action: FormData => void | Promise<void>,
  formData: FormData,
): void {
  const pendingState: FormStatus = {
    pending: true,
    data: formData,
    method: form.method,
    action: action,
  };
  if (__DEV__) {
    Object.freeze(pendingState);
  }
  startHostTransition(formInst, pendingState, action, formData);
}
