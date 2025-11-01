/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {Dispatcher} from 'react-reconciler/src/ReactInternalTypes';
import type {Awaited} from 'shared/ReactTypes';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';

type FormStatusNotPending = {|
  pending: false,
  data: null,
  method: null,
  action: null,
|};

type FormStatusPending = {|
  pending: true,
  data: FormData,
  method: string,
  action: string | (FormData => void | Promise<void>) | null,
|};

export type FormStatus = FormStatusPending | FormStatusNotPending;

// Since the "not pending" value is always the same, we can reuse the
// same object across all transitions.
const sharedNotPendingObject: FormStatusNotPending = {
  pending: false,
  data: null,
  method: null,
  action: null,
};

export const NotPending: FormStatus = __DEV__
  ? Object.freeze(sharedNotPendingObject)
  : sharedNotPendingObject;

function resolveDispatcher() {
  // Copied from react/src/ReactHooks.js. It's the same thing but in a
  // different package.
  const dispatcher = ReactSharedInternals.H;
  if (__DEV__) {
    if (dispatcher === null) {
      console.error(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
          ' one of the following reasons:\n' +
          '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
          '2. You might be breaking the Rules of Hooks\n' +
          '3. You might have more than one copy of React in the same app\n' +
          'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.',
      );
    }
  }
  // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.
  return ((dispatcher: any): Dispatcher);
}

/**
 * Helper function to determine if a form field is controlled
 * A field is considered controlled if it has a value or checked prop from React
 */
function isControlledField(element: HTMLElement): boolean {
  // Get the React fiber node associated with this DOM element
  const fiber = element._reactInternalFiber || element.__reactInternalInstance;
  
  if (!fiber) {
    return false;
  }
  
  // Check for controlled props on the fiber's memoizedProps
  const props = fiber.memoizedProps;
  if (!props) {
    return false;
  }
  
  // For input elements, check for 'value' or 'checked' props
  if (element.tagName === 'INPUT') {
    const inputType = element.type;
    if (inputType === 'checkbox' || inputType === 'radio') {
      return props.hasOwnProperty('checked');
    } else {
      return props.hasOwnProperty('value');
    }
  }
  
  // For textarea and select elements, check for 'value' prop
  if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
    return props.hasOwnProperty('value');
  }
  
  return false;
}

/**
 * Reset form fields after a successful form action
 * Only reset uncontrolled fields, skip controlled fields
 */
function resetFormFieldsAfterAction(form: HTMLFormElement): void {
  const formElements = form.elements;
  
  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i] as HTMLElement;
    
    // Skip if this is a controlled field
    if (isControlledField(element)) {
      if (__DEV__) {
        console.log('Skipping reset for controlled field:', element);
      }
      continue;
    }
    
    // Reset uncontrolled fields as before
    if (element.tagName === 'INPUT') {
      const inputElement = element as HTMLInputElement;
      const inputType = inputElement.type;
      
      if (inputType === 'checkbox' || inputType === 'radio') {
        inputElement.checked = inputElement.defaultChecked;
      } else if (inputType !== 'submit' && inputType !== 'button' && inputType !== 'reset') {
        inputElement.value = inputElement.defaultValue;
      }
    } else if (element.tagName === 'TEXTAREA') {
      const textareaElement = element as HTMLTextAreaElement;
      textareaElement.value = textareaElement.defaultValue;
    } else if (element.tagName === 'SELECT') {
      const selectElement = element as HTMLSelectElement;
      selectElement.selectedIndex = selectElement.defaultSelected ? selectElement.selectedIndex : 0;
      
      // Reset individual options
      for (let j = 0; j < selectElement.options.length; j++) {
        const option = selectElement.options[j];
        option.selected = option.defaultSelected;
      }
    }
  }
}

export function useFormStatus(): FormStatus {
  const dispatcher = resolveDispatcher();
  return dispatcher.useHostTransitionStatus();
}

export function useFormState<S, P>(
  action: (Awaited<S>, P) => S,
  initialState: Awaited<S>,
  permalink?: string,
): [Awaited<S>, (P) => void, boolean] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useFormState(action, initialState, permalink);
}

export function requestFormReset(form: HTMLFormElement) {
  // Reset form fields with controlled/uncontrolled logic
  resetFormFieldsAfterAction(form);
  
  // Call the original reset functionality
  ReactDOMSharedInternals.d /* ReactDOMCurrentDispatcher */
    .r(/* requestFormReset */ form);
}

// Export the helper function for potential external use
export {isControlledField, resetFormFieldsAfterAction};
