/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {InputWithWrapperState} from './ReactDOMInput';

import {
  registrationNameDependencies,
  possibleRegistrationNames,
} from '../events/EventRegistry';

import {canUseDOM} from 'shared/ExecutionEnvironment';
import {checkHtmlStringCoercion} from 'shared/CheckStringCoercion';

import {
  getValueForAttribute,
  getValueForAttributeOnCustomComponent,
  getValueForProperty,
  setValueForProperty,
  setValueForPropertyOnCustomComponent,
  setValueForAttribute,
} from './DOMPropertyOperations';
import {
  initWrapperState as ReactDOMInputInitWrapperState,
  postMountWrapper as ReactDOMInputPostMountWrapper,
  updateChecked as ReactDOMInputUpdateChecked,
  updateWrapper as ReactDOMInputUpdateWrapper,
  restoreControlledState as ReactDOMInputRestoreControlledState,
} from './ReactDOMInput';
import {
  postMountWrapper as ReactDOMOptionPostMountWrapper,
  validateProps as ReactDOMOptionValidateProps,
} from './ReactDOMOption';
import {
  initWrapperState as ReactDOMSelectInitWrapperState,
  postMountWrapper as ReactDOMSelectPostMountWrapper,
  restoreControlledState as ReactDOMSelectRestoreControlledState,
  postUpdateWrapper as ReactDOMSelectPostUpdateWrapper,
} from './ReactDOMSelect';
import {
  initWrapperState as ReactDOMTextareaInitWrapperState,
  postMountWrapper as ReactDOMTextareaPostMountWrapper,
  updateWrapper as ReactDOMTextareaUpdateWrapper,
  restoreControlledState as ReactDOMTextareaRestoreControlledState,
} from './ReactDOMTextarea';
import {track} from './inputValueTracking';
import setInnerHTML from './setInnerHTML';
import setTextContent from './setTextContent';
import {
  createDangerousStringForStyles,
  setValueForStyles,
  validateShorthandPropertyCollisionInDev,
} from './CSSPropertyOperations';
import {HTML_NAMESPACE, getIntrinsicNamespace} from './DOMNamespaces';
import {getPropertyInfo} from '../shared/DOMProperty';
import isCustomElement from '../shared/isCustomElement';
import possibleStandardNames from '../shared/possibleStandardNames';
import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';

import {
  enableCustomElementPropertySupport,
  enableClientRenderFallbackOnTextMismatch,
  enableHostSingletons,
  disableIEWorkarounds,
} from 'shared/ReactFeatureFlags';
import {
  mediaEventTypes,
  listenToNonDelegatedEvent,
} from '../events/DOMPluginEventSystem';

let didWarnInvalidHydration = false;
let canDiffStyleForHydrationWarning;
if (__DEV__) {
  // IE 11 parses & normalizes the style attribute as opposed to other
  // browsers. It adds spaces and sorts the properties in some
  // non-alphabetical order. Handling that would require sorting CSS
  // properties in the client & server versions or applying
  // `expectedStyle` to a temporary DOM node to read its `style` attribute
  // normalized. Since it only affects IE, we're skipping style warnings
  // in that browser completely in favor of doing all that work.
  // See https://github.com/facebook/react/issues/11807
  canDiffStyleForHydrationWarning =
    disableIEWorkarounds || (canUseDOM && !document.documentMode);
}

function validatePropertiesInDevelopment(type: string, props: any) {
  if (__DEV__) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props, {
      registrationNameDependencies,
      possibleRegistrationNames,
    });
    if (
      props.contentEditable &&
      !props.suppressContentEditableWarning &&
      props.children != null
    ) {
      console.error(
        'A component is `contentEditable` and contains `children` managed by ' +
          'React. It is now your responsibility to guarantee that none of ' +
          'those nodes are unexpectedly modified or duplicated. This is ' +
          'probably not intentional.',
      );
    }
  }
}

function warnForPropDifference(
  propName: string,
  serverValue: mixed,
  clientValue: mixed,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    const normalizedClientValue =
      normalizeMarkupForTextOrAttribute(clientValue);
    const normalizedServerValue =
      normalizeMarkupForTextOrAttribute(serverValue);
    if (normalizedServerValue === normalizedClientValue) {
      return;
    }
    didWarnInvalidHydration = true;
    console.error(
      'Prop `%s` did not match. Server: %s Client: %s',
      propName,
      JSON.stringify(normalizedServerValue),
      JSON.stringify(normalizedClientValue),
    );
  }
}

function warnForExtraAttributes(attributeNames: Set<string>) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    const names = [];
    attributeNames.forEach(function (name) {
      names.push(name);
    });
    console.error('Extra attributes from the server: %s', names);
  }
}

function warnForInvalidEventListener(registrationName: string, listener: any) {
  if (__DEV__) {
    if (listener === false) {
      console.error(
        'Expected `%s` listener to be a function, instead got `false`.\n\n' +
          'If you used to conditionally omit it with %s={condition && value}, ' +
          'pass %s={condition ? value : undefined} instead.',
        registrationName,
        registrationName,
        registrationName,
      );
    } else {
      console.error(
        'Expected `%s` listener to be a function, instead got a value of `%s` type.',
        registrationName,
        typeof listener,
      );
    }
  }
}

// Parse the HTML and read it back to normalize the HTML string so that it
// can be used for comparison.
function normalizeHTML(parent: Element, html: string) {
  if (__DEV__) {
    // We could have created a separate document here to avoid
    // re-initializing custom elements if they exist. But this breaks
    // how <noscript> is being handled. So we use the same document.
    // See the discussion in https://github.com/facebook/react/pull/11157.
    const testElement =
      parent.namespaceURI === HTML_NAMESPACE
        ? parent.ownerDocument.createElement(parent.tagName)
        : parent.ownerDocument.createElementNS(
            (parent.namespaceURI: any),
            parent.tagName,
          );
    testElement.innerHTML = html;
    return testElement.innerHTML;
  }
}

// HTML parsing normalizes CR and CRLF to LF.
// It also can turn \u0000 into \uFFFD inside attributes.
// https://www.w3.org/TR/html5/single-page.html#preprocessing-the-input-stream
// If we have a mismatch, it might be caused by that.
// We will still patch up in this case but not fire the warning.
const NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
const NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;

function normalizeMarkupForTextOrAttribute(markup: mixed): string {
  if (__DEV__) {
    checkHtmlStringCoercion(markup);
  }
  const markupString = typeof markup === 'string' ? markup : '' + (markup: any);
  return markupString
    .replace(NORMALIZE_NEWLINES_REGEX, '\n')
    .replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, '');
}

export function checkForUnmatchedText(
  serverText: string,
  clientText: string | number,
  isConcurrentMode: boolean,
  shouldWarnDev: boolean,
) {
  const normalizedClientText = normalizeMarkupForTextOrAttribute(clientText);
  const normalizedServerText = normalizeMarkupForTextOrAttribute(serverText);
  if (normalizedServerText === normalizedClientText) {
    return;
  }

  if (shouldWarnDev) {
    if (__DEV__) {
      if (!didWarnInvalidHydration) {
        didWarnInvalidHydration = true;
        console.error(
          'Text content did not match. Server: "%s" Client: "%s"',
          normalizedServerText,
          normalizedClientText,
        );
      }
    }
  }

  if (isConcurrentMode && enableClientRenderFallbackOnTextMismatch) {
    // In concurrent roots, we throw when there's a text mismatch and revert to
    // client rendering, up to the nearest Suspense boundary.
    throw new Error('Text content does not match server-rendered HTML.');
  }
}

function noop() {}

export function trapClickOnNonInteractiveElement(node: HTMLElement) {
  // Mobile Safari does not fire properly bubble click events on
  // non-interactive elements, which means delegated click listeners do not
  // fire. The workaround for this bug involves attaching an empty click
  // listener on the target node.
  // https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
  // Just set it using the onclick property so that we don't have to manage any
  // bookkeeping for it. Not sure if we need to clear it when the listener is
  // removed.
  // TODO: Only do this for the relevant Safaris maybe?
  node.onclick = noop;
}

function setProp(
  domElement: Element,
  tag: string,
  key: string,
  value: mixed,
  isCustomElementTag: boolean,
  props: any,
): void {
  switch (key) {
    case 'style': {
      if (value != null && typeof value !== 'object') {
        throw new Error(
          'The `style` prop expects a mapping from style properties to values, ' +
            "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
            'using JSX.',
        );
      }
      if (__DEV__) {
        if (value) {
          // Freeze the next style object so that we can assume it won't be
          // mutated. We have already warned for this in the past.
          Object.freeze(value);
        }
      }
      // Relies on `updateStylesByID` not mutating `styleUpdates`.
      setValueForStyles(domElement, value);
      break;
    }
    case 'dangerouslySetInnerHTML': {
      if (value != null) {
        if (typeof value !== 'object' || !('__html' in value)) {
          throw new Error(
            '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
              'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
              'for more information.',
          );
        }
        const nextHtml: any = value.__html;
        if (nextHtml != null) {
          if (props.children != null) {
            throw new Error(
              'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
            );
          }
          if (disableIEWorkarounds) {
            domElement.innerHTML = nextHtml;
          } else {
            setInnerHTML(domElement, nextHtml);
          }
        }
      }
      break;
    }
    case 'children': {
      if (typeof value === 'string') {
        // Avoid setting initial textContent when the text is empty. In IE11 setting
        // textContent on a <textarea> will cause the placeholder to not
        // show within the <textarea> until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        const canSetTextContent =
          (!enableHostSingletons || tag !== 'body') &&
          (tag !== 'textarea' || value !== '');
        if (canSetTextContent) {
          setTextContent(domElement, value);
        }
      } else if (typeof value === 'number') {
        const canSetTextContent = !enableHostSingletons || tag !== 'body';
        if (canSetTextContent) {
          setTextContent(domElement, '' + value);
        }
      }
      break;
    }
    case 'onScroll': {
      if (value != null) {
        if (__DEV__ && typeof value !== 'function') {
          warnForInvalidEventListener(key, value);
        }
        listenToNonDelegatedEvent('scroll', domElement);
      }
      break;
    }
    case 'onClick': {
      // TODO: This cast may not be sound for SVG, MathML or custom elements.
      if (value != null) {
        if (__DEV__ && typeof value !== 'function') {
          warnForInvalidEventListener(key, value);
        }
        trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
      }
      break;
    }
    // Note: `option.selected` is not updated if `select.multiple` is
    // disabled with `removeAttribute`. We have special logic for handling this.
    case 'multiple': {
      (domElement: any).multiple =
        value && typeof value !== 'function' && typeof value !== 'symbol';
      break;
    }
    case 'muted': {
      (domElement: any).muted =
        value && typeof value !== 'function' && typeof value !== 'symbol';
      break;
    }
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'defaultValue': // Reserved
    case 'defaultChecked':
    case 'innerHTML': {
      // Noop
      break;
    }
    case 'autoFocus': {
      // We polyfill it separately on the client during commit.
      // We could have excluded it in the property list instead of
      // adding a special case here, but then it wouldn't be emitted
      // on server rendering (but we *do* want to emit it in SSR).
      break;
    }
    case 'innerText': // Properties
    case 'textContent':
      if (enableCustomElementPropertySupport) {
        break;
      }
    // eslint-disable-next-line no-fallthrough
    default: {
      if (registrationNameDependencies.hasOwnProperty(key)) {
        if (__DEV__ && value != null && typeof value !== 'function') {
          warnForInvalidEventListener(key, value);
        }
      } else {
        if (isCustomElementTag) {
          if (enableCustomElementPropertySupport) {
            setValueForPropertyOnCustomComponent(domElement, key, value);
          } else {
            if (typeof value === 'boolean') {
              // Special case before the new flag is on
              value = '' + (value: any);
            }
            setValueForAttribute(domElement, key, value);
          }
        } else {
          if (
            // shouldIgnoreAttribute
            // We have already filtered out reserved words.
            key.length > 2 &&
            (key[0] === 'o' || key[0] === 'O') &&
            (key[1] === 'n' || key[1] === 'N')
          ) {
            return;
          }

          const propertyInfo = getPropertyInfo(key);
          if (propertyInfo !== null) {
            setValueForProperty(domElement, propertyInfo, value);
          } else {
            setValueForAttribute(domElement, key, value);
          }
        }
      }
    }
  }
}

export function setInitialProperties(
  domElement: Element,
  tag: string,
  props: Object,
): void {
  if (__DEV__) {
    validatePropertiesInDevelopment(tag, props);
  }

  // TODO: Make sure that we check isMounted before firing any of these events.

  switch (tag) {
    case 'input': {
      ReactDOMInputInitWrapperState(domElement, props);
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the invalid event.
      listenToNonDelegatedEvent('invalid', domElement);
      for (const propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
          continue;
        }
        const propValue = props[propKey];
        if (propValue == null) {
          continue;
        }
        switch (propKey) {
          case 'checked': {
            const node = ((domElement: any): InputWithWrapperState);
            const checked =
              propValue != null ? propValue : node._wrapperState.initialChecked;
            node.checked =
              !!checked &&
              typeof checked !== 'function' &&
              checked !== 'symbol';
            break;
          }
          case 'value': {
            // This is handled by updateWrapper below.
            break;
          }
          case 'children':
          case 'dangerouslySetInnerHTML': {
            if (propValue != null) {
              throw new Error(
                `${tag} is a void element tag and must neither have \`children\` nor ` +
                  'use `dangerouslySetInnerHTML`.',
              );
            }
            break;
          }
          // defaultChecked and defaultValue are ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, props);
          }
        }
      }
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      track((domElement: any));
      ReactDOMInputPostMountWrapper(domElement, props, false);
      return;
    }
    case 'select': {
      ReactDOMSelectInitWrapperState(domElement, props);
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the invalid event.
      listenToNonDelegatedEvent('invalid', domElement);
      for (const propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
          continue;
        }
        const propValue = props[propKey];
        if (propValue == null) {
          continue;
        }
        switch (propKey) {
          case 'value': {
            // This is handled by updateWrapper below.
            break;
          }
          // defaultValue are ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, props);
          }
        }
      }
      ReactDOMSelectPostMountWrapper(domElement, props);
      return;
    }
    case 'textarea': {
      ReactDOMTextareaInitWrapperState(domElement, props);
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the invalid event.
      listenToNonDelegatedEvent('invalid', domElement);
      for (const propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
          continue;
        }
        const propValue = props[propKey];
        if (propValue == null) {
          continue;
        }
        switch (propKey) {
          case 'value': {
            // This is handled by updateWrapper below.
            break;
          }
          case 'children': {
            // TODO: Handled by initWrapperState above.
            break;
          }
          case 'dangerouslySetInnerHTML': {
            if (propValue != null) {
              // TODO: Do we really need a special error message for this. It's also pretty blunt.
              throw new Error(
                '`dangerouslySetInnerHTML` does not make sense on <textarea>.',
              );
            }
            break;
          }
          // defaultValue is ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, props);
          }
        }
      }
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      track((domElement: any));
      ReactDOMTextareaPostMountWrapper(domElement, props);
      return;
    }
    case 'option': {
      ReactDOMOptionValidateProps(domElement, props);
      for (const propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
          continue;
        }
        const propValue = props[propKey];
        if (propValue == null) {
          continue;
        }
        switch (propKey) {
          case 'selected': {
            // TODO: Remove support for selected on option.
            (domElement: any).selected =
              propValue &&
              typeof propValue !== 'function' &&
              typeof propValue !== 'symbol';
            break;
          }
          default: {
            setProp(domElement, tag, propKey, propValue, false, props);
          }
        }
      }
      ReactDOMOptionPostMountWrapper(domElement, props);
      return;
    }
    case 'dialog': {
      listenToNonDelegatedEvent('cancel', domElement);
      listenToNonDelegatedEvent('close', domElement);
      break;
    }
    case 'iframe':
    case 'object': {
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the load event.
      listenToNonDelegatedEvent('load', domElement);
      break;
    }
    case 'video':
    case 'audio': {
      // We listen to these events in case to ensure emulated bubble
      // listeners still fire for all the media events.
      for (let i = 0; i < mediaEventTypes.length; i++) {
        listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
      }
      break;
    }
    case 'image': {
      // We listen to these events in case to ensure emulated bubble
      // listeners still fire for error and load events.
      listenToNonDelegatedEvent('error', domElement);
      listenToNonDelegatedEvent('load', domElement);
      break;
    }
    case 'details': {
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the toggle event.
      listenToNonDelegatedEvent('toggle', domElement);
      break;
    }
    case 'embed':
    case 'source':
    case 'img':
    case 'link': {
      // These are void elements that also need delegated events.
      listenToNonDelegatedEvent('error', domElement);
      listenToNonDelegatedEvent('load', domElement);
      // We fallthrough to the return of the void elements
    }
    // eslint-disable-next-line no-fallthrough
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'track':
    case 'wbr':
    case 'menuitem': {
      // Void elements
      for (const propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
          continue;
        }
        const propValue = props[propKey];
        if (propValue == null) {
          continue;
        }
        switch (propKey) {
          case 'children':
          case 'dangerouslySetInnerHTML': {
            // TODO: Can we make this a DEV warning to avoid this deny list?
            throw new Error(
              `${tag} is a void element tag and must neither have \`children\` nor ` +
                'use `dangerouslySetInnerHTML`.',
            );
          }
          // defaultChecked and defaultValue are ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, props);
          }
        }
      }
      return;
    }
  }

  const isCustomElementTag = isCustomElement(tag, props);
  for (const propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    const propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    setProp(domElement, tag, propKey, propValue, isCustomElementTag, props);
  }
}

// Calculate the diff between the two objects.
export function diffProperties(
  domElement: Element,
  tag: string,
  lastProps: Object,
  nextProps: Object,
): null | Array<mixed> {
  if (__DEV__) {
    validatePropertiesInDevelopment(tag, nextProps);
  }

  let updatePayload: null | Array<any> = null;

  let propKey;
  let styleName;
  let styleUpdates = null;
  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      continue;
    }
    switch (propKey) {
      case 'style': {
        const lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            if (!styleUpdates) {
              styleUpdates = ({}: {[string]: $FlowFixMe});
            }
            styleUpdates[styleName] = '';
          }
        }
        break;
      }
      default: {
        // For all other deleted properties we add it to the queue. We use
        // the allowed property list in the commit phase instead.
        (updatePayload = updatePayload || []).push(propKey, null);
      }
    }
  }
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (
      nextProps.hasOwnProperty(propKey) &&
      nextProp !== lastProp &&
      (nextProp != null || lastProp != null)
    ) {
      switch (propKey) {
        case 'style': {
          if (lastProp) {
            // Unset styles on `lastProp` but not on `nextProp`.
            for (styleName in lastProp) {
              if (
                lastProp.hasOwnProperty(styleName) &&
                (!nextProp || !nextProp.hasOwnProperty(styleName))
              ) {
                if (!styleUpdates) {
                  styleUpdates = ({}: {[string]: string});
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
                  styleUpdates = ({}: {[string]: $FlowFixMe});
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
              updatePayload.push(propKey, styleUpdates);
            }
            styleUpdates = nextProp;
          }
          break;
        }
        case 'is':
          if (__DEV__) {
            console.error(
              'Cannot update the "is" prop after it has been initialized.',
            );
          }
        // eslint-disable-next-line no-fallthrough
        default: {
          (updatePayload = updatePayload || []).push(propKey, nextProp);
        }
      }
    }
  }
  if (styleUpdates) {
    if (__DEV__) {
      validateShorthandPropertyCollisionInDev(styleUpdates, nextProps.style);
    }
    (updatePayload = updatePayload || []).push('style', styleUpdates);
  }
  return updatePayload;
}

// Apply the diff.
export function updateProperties(
  domElement: Element,
  updatePayload: Array<any>,
  tag: string,
  lastProps: Object,
  nextProps: Object,
): void {
  switch (tag) {
    case 'input': {
      // Update checked *before* name.
      // In the middle of an update, it is possible to have multiple checked.
      // When a checked radio tries to change name, browser makes another radio's checked false.
      if (nextProps.type === 'radio' && nextProps.name != null) {
        ReactDOMInputUpdateChecked(domElement, nextProps);
      }
      for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1];
        switch (propKey) {
          case 'checked': {
            const node = ((domElement: any): InputWithWrapperState);
            const checked =
              propValue != null ? propValue : node._wrapperState.initialChecked;
            node.checked =
              !!checked &&
              typeof checked !== 'function' &&
              checked !== 'symbol';
            break;
          }
          case 'value': {
            // This is handled by updateWrapper below.
            break;
          }
          case 'children':
          case 'dangerouslySetInnerHTML': {
            if (propValue != null) {
              throw new Error(
                `${tag} is a void element tag and must neither have \`children\` nor ` +
                  'use `dangerouslySetInnerHTML`.',
              );
            }
            break;
          }
          // defaultChecked and defaultValue are ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, nextProps);
          }
        }
      }
      // Update the wrapper around inputs *after* updating props. This has to
      // happen after updating the rest of props. Otherwise HTML5 input validations
      // raise warnings and prevent the new value from being assigned.
      ReactDOMInputUpdateWrapper(domElement, nextProps);
      return;
    }
    case 'select': {
      for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1];
        switch (propKey) {
          case 'value': {
            // This is handled by updateWrapper below.
            break;
          }
          // defaultValue are ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, nextProps);
          }
        }
      }
      // <select> value update needs to occur after <option> children
      // reconciliation
      ReactDOMSelectPostUpdateWrapper(domElement, nextProps);
      return;
    }
    case 'textarea': {
      for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1];
        switch (propKey) {
          case 'value': {
            // This is handled by updateWrapper below.
            break;
          }
          case 'children': {
            // TODO: This doesn't actually do anything if it updates.
            break;
          }
          case 'dangerouslySetInnerHTML': {
            if (propValue != null) {
              // TODO: Do we really need a special error message for this. It's also pretty blunt.
              throw new Error(
                '`dangerouslySetInnerHTML` does not make sense on <textarea>.',
              );
            }
            break;
          }
          // defaultValue is ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, nextProps);
          }
        }
      }
      ReactDOMTextareaUpdateWrapper(domElement, nextProps);
      return;
    }
    case 'option': {
      for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1];
        switch (propKey) {
          case 'selected': {
            // TODO: Remove support for selected on option.
            (domElement: any).selected =
              propValue &&
              typeof propValue !== 'function' &&
              typeof propValue !== 'symbol';
            break;
          }
          default: {
            setProp(domElement, tag, propKey, propValue, false, nextProps);
          }
        }
      }
      return;
    }
    case 'img':
    case 'link':
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
    case 'menuitem': {
      // Void elements
      for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1];
        switch (propKey) {
          case 'children':
          case 'dangerouslySetInnerHTML': {
            if (propValue != null) {
              // TODO: Can we make this a DEV warning to avoid this deny list?
              throw new Error(
                `${tag} is a void element tag and must neither have \`children\` nor ` +
                  'use `dangerouslySetInnerHTML`.',
              );
            }
            break;
          }
          // defaultChecked and defaultValue are ignored by setProp
          default: {
            setProp(domElement, tag, propKey, propValue, false, nextProps);
          }
        }
      }
      return;
    }
  }

  const isCustomElementTag = isCustomElement(tag, nextProps);
  // Apply the diff.
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    setProp(domElement, tag, propKey, propValue, isCustomElementTag, nextProps);
  }
}

function getPossibleStandardName(propName: string): string | null {
  if (__DEV__) {
    const lowerCasedName = propName.toLowerCase();
    if (!possibleStandardNames.hasOwnProperty(lowerCasedName)) {
      return null;
    }
    return possibleStandardNames[lowerCasedName] || null;
  }
  return null;
}

function diffHydratedStyles(domElement: Element, value: mixed) {
  if (value != null && typeof value !== 'object') {
    throw new Error(
      'The `style` prop expects a mapping from style properties to values, ' +
        "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
        'using JSX.',
    );
  }
  if (canDiffStyleForHydrationWarning) {
    const expectedStyle = createDangerousStringForStyles(value);
    const serverValue = domElement.getAttribute('style');
    if (expectedStyle !== serverValue) {
      warnForPropDifference('style', serverValue, expectedStyle);
    }
  }
}

function diffHydratedCustomComponent(
  domElement: Element,
  tag: string,
  props: Object,
  parentNamespaceDev: string,
  extraAttributeNames: Set<string>,
) {
  for (const propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = props[propKey];
    if (nextProp == null) {
      continue;
    }
    if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (typeof nextProp !== 'function') {
        warnForInvalidEventListener(propKey, nextProp);
      }
      continue;
    }
    if (props.suppressHydrationWarning === true) {
      // Don't bother comparing. We're ignoring all these warnings.
      continue;
    }
    // Validate that the properties correspond to their expected values.
    switch (propKey) {
      case 'children': // Checked above already
      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'defaultValue':
      case 'defaultChecked':
      case 'innerHTML':
        // Noop
        continue;
      case 'dangerouslySetInnerHTML':
        const serverHTML = domElement.innerHTML;
        const nextHtml = nextProp ? nextProp.__html : undefined;
        if (nextHtml != null) {
          const expectedHTML = normalizeHTML(domElement, nextHtml);
          if (expectedHTML !== serverHTML) {
            warnForPropDifference(propKey, serverHTML, expectedHTML);
          }
        }
        continue;
      case 'style':
        extraAttributeNames.delete(propKey);
        diffHydratedStyles(domElement, nextProp);
        continue;
      case 'offsetParent':
      case 'offsetTop':
      case 'offsetLeft':
      case 'offsetWidth':
      case 'offsetHeight':
      case 'isContentEditable':
      case 'outerText':
      case 'outerHTML':
        if (enableCustomElementPropertySupport) {
          extraAttributeNames.delete(propKey.toLowerCase());
          if (__DEV__) {
            console.error(
              'Assignment to read-only property will result in a no-op: `%s`',
              propKey,
            );
          }
          continue;
        }
      // eslint-disable-next-line no-fallthrough
      case 'className':
        if (enableCustomElementPropertySupport) {
          // className is a special cased property on the server to render as an attribute.
          extraAttributeNames.delete('class');
          const serverValue = getValueForAttributeOnCustomComponent(
            domElement,
            'class',
            nextProp,
          );
          if (nextProp !== serverValue) {
            warnForPropDifference('className', serverValue, nextProp);
          }
          continue;
        }
      // eslint-disable-next-line no-fallthrough
      default: {
        let ownNamespaceDev = parentNamespaceDev;
        if (ownNamespaceDev === HTML_NAMESPACE) {
          ownNamespaceDev = getIntrinsicNamespace(tag);
        }
        if (ownNamespaceDev === HTML_NAMESPACE) {
          extraAttributeNames.delete(propKey.toLowerCase());
        } else {
          extraAttributeNames.delete(propKey);
        }
        const serverValue = getValueForAttributeOnCustomComponent(
          domElement,
          propKey,
          nextProp,
        );
        if (nextProp !== serverValue) {
          warnForPropDifference(propKey, serverValue, nextProp);
        }
      }
    }
  }
}

function diffHydratedGenericElement(
  domElement: Element,
  tag: string,
  props: Object,
  parentNamespaceDev: string,
  extraAttributeNames: Set<string>,
) {
  for (const propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = props[propKey];
    if (nextProp == null) {
      continue;
    }
    if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (typeof nextProp !== 'function') {
        warnForInvalidEventListener(propKey, nextProp);
      }
      continue;
    }
    if (props.suppressHydrationWarning === true) {
      // Don't bother comparing. We're ignoring all these warnings.
      continue;
    }
    // Validate that the properties correspond to their expected values.
    switch (propKey) {
      case 'children': // Checked above already
      case 'suppressContentEditableWarning':
      case 'suppressHydrationWarning':
      case 'value': // Controlled attributes are not validated
      case 'checked': // TODO: Only ignore them on controlled tags.
      case 'selected':
      case 'defaultValue':
      case 'defaultChecked':
      case 'innerHTML':
        // Noop
        continue;
      case 'dangerouslySetInnerHTML':
        const serverHTML = domElement.innerHTML;
        const nextHtml = nextProp ? nextProp.__html : undefined;
        if (nextHtml != null) {
          const expectedHTML = normalizeHTML(domElement, nextHtml);
          if (expectedHTML !== serverHTML) {
            warnForPropDifference(propKey, serverHTML, expectedHTML);
          }
        }
        continue;
      case 'style':
        extraAttributeNames.delete(propKey);
        diffHydratedStyles(domElement, nextProp);
        continue;
      case 'multiple': {
        extraAttributeNames.delete(propKey);
        const serverValue = (domElement: any).multiple;
        if (nextProp !== serverValue) {
          warnForPropDifference('multiple', serverValue, nextProp);
        }
        continue;
      }
      case 'muted': {
        extraAttributeNames.delete(propKey);
        const serverValue = (domElement: any).muted;
        if (nextProp !== serverValue) {
          warnForPropDifference('muted', serverValue, nextProp);
        }
        continue;
      }
      default:
        if (
          // shouldIgnoreAttribute
          // We have already filtered out null/undefined and reserved words.
          propKey.length > 2 &&
          (propKey[0] === 'o' || propKey[0] === 'O') &&
          (propKey[1] === 'n' || propKey[1] === 'N')
        ) {
          continue;
        }
        const propertyInfo = getPropertyInfo(propKey);
        let isMismatchDueToBadCasing = false;
        let serverValue;
        if (propertyInfo !== null) {
          extraAttributeNames.delete(propertyInfo.attributeName);
          serverValue = getValueForProperty(
            domElement,
            propKey,
            nextProp,
            propertyInfo,
          );
        } else {
          let ownNamespaceDev = parentNamespaceDev;
          if (ownNamespaceDev === HTML_NAMESPACE) {
            ownNamespaceDev = getIntrinsicNamespace(tag);
          }
          if (ownNamespaceDev === HTML_NAMESPACE) {
            extraAttributeNames.delete(propKey.toLowerCase());
          } else {
            const standardName = getPossibleStandardName(propKey);
            if (standardName !== null && standardName !== propKey) {
              // If an SVG prop is supplied with bad casing, it will
              // be successfully parsed from HTML, but will produce a mismatch
              // (and would be incorrectly rendered on the client).
              // However, we already warn about bad casing elsewhere.
              // So we'll skip the misleading extra mismatch warning in this case.
              isMismatchDueToBadCasing = true;
              extraAttributeNames.delete(standardName);
            }
            extraAttributeNames.delete(propKey);
          }
          serverValue = getValueForAttribute(domElement, propKey, nextProp);
        }

        if (nextProp !== serverValue && !isMismatchDueToBadCasing) {
          warnForPropDifference(propKey, serverValue, nextProp);
        }
    }
  }
}

export function diffHydratedProperties(
  domElement: Element,
  tag: string,
  props: Object,
  isConcurrentMode: boolean,
  shouldWarnDev: boolean,
  parentNamespaceDev: string,
): null | Array<mixed> {
  if (__DEV__) {
    validatePropertiesInDevelopment(tag, props);
  }

  // TODO: Make sure that we check isMounted before firing any of these events.
  switch (tag) {
    case 'dialog':
      listenToNonDelegatedEvent('cancel', domElement);
      listenToNonDelegatedEvent('close', domElement);
      break;
    case 'iframe':
    case 'object':
    case 'embed':
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the load event.
      listenToNonDelegatedEvent('load', domElement);
      break;
    case 'video':
    case 'audio':
      // We listen to these events in case to ensure emulated bubble
      // listeners still fire for all the media events.
      for (let i = 0; i < mediaEventTypes.length; i++) {
        listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
      }
      break;
    case 'source':
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the error event.
      listenToNonDelegatedEvent('error', domElement);
      break;
    case 'img':
    case 'image':
    case 'link':
      // We listen to these events in case to ensure emulated bubble
      // listeners still fire for error and load events.
      listenToNonDelegatedEvent('error', domElement);
      listenToNonDelegatedEvent('load', domElement);
      break;
    case 'details':
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the toggle event.
      listenToNonDelegatedEvent('toggle', domElement);
      break;
    case 'input':
      ReactDOMInputInitWrapperState(domElement, props);
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the invalid event.
      listenToNonDelegatedEvent('invalid', domElement);
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      track((domElement: any));
      // For input and textarea we current always set the value property at
      // post mount to force it to diverge from attributes. However, for
      // option and select we don't quite do the same thing and select
      // is not resilient to the DOM state changing so we don't do that here.
      // TODO: Consider not doing this for input and textarea.
      ReactDOMInputPostMountWrapper(domElement, props, true);
      break;
    case 'option':
      ReactDOMOptionValidateProps(domElement, props);
      break;
    case 'select':
      ReactDOMSelectInitWrapperState(domElement, props);
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the invalid event.
      listenToNonDelegatedEvent('invalid', domElement);
      break;
    case 'textarea':
      ReactDOMTextareaInitWrapperState(domElement, props);
      // We listen to this event in case to ensure emulated bubble
      // listeners still fire for the invalid event.
      listenToNonDelegatedEvent('invalid', domElement);
      // TODO: Make sure we check if this is still unmounted or do any clean
      // up necessary since we never stop tracking anymore.
      track((domElement: any));
      ReactDOMTextareaPostMountWrapper(domElement, props);
      break;
  }

  let updatePayload = null;

  const children = props.children;
  // For text content children we compare against textContent. This
  // might match additional HTML that is hidden when we read it using
  // textContent. E.g. "foo" will match "f<span>oo</span>" but that still
  // satisfies our requirement. Our requirement is not to produce perfect
  // HTML and attributes. Ideally we should preserve structure but it's
  // ok not to if the visible content is still enough to indicate what
  // even listeners these nodes might be wired up to.
  // TODO: Warn if there is more than a single textNode as a child.
  // TODO: Should we use domElement.firstChild.nodeValue to compare?
  if (typeof children === 'string' || typeof children === 'number') {
    if (domElement.textContent !== '' + children) {
      if (props.suppressHydrationWarning !== true) {
        checkForUnmatchedText(
          domElement.textContent,
          children,
          isConcurrentMode,
          shouldWarnDev,
        );
      }
      if (!isConcurrentMode || !enableClientRenderFallbackOnTextMismatch) {
        updatePayload = ['children', children];
      }
    }
  }

  if (props.onScroll != null) {
    listenToNonDelegatedEvent('scroll', domElement);
  }

  if (props.onClick != null) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
  }

  if (__DEV__ && shouldWarnDev) {
    const extraAttributeNames: Set<string> = new Set();
    const attributes = domElement.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const name = attributes[i].name.toLowerCase();
      switch (name) {
        // Controlled attributes are not validated
        // TODO: Only ignore them on controlled tags.
        case 'value':
          break;
        case 'checked':
          break;
        case 'selected':
          break;
        default:
          // Intentionally use the original name.
          // See discussion in https://github.com/facebook/react/pull/10676.
          extraAttributeNames.add(attributes[i].name);
      }
    }
    if (isCustomElement(tag, props)) {
      diffHydratedCustomComponent(
        domElement,
        tag,
        props,
        parentNamespaceDev,
        extraAttributeNames,
      );
    } else {
      diffHydratedGenericElement(
        domElement,
        tag,
        props,
        parentNamespaceDev,
        extraAttributeNames,
      );
    }
    if (
      extraAttributeNames.size > 0 &&
      props.suppressHydrationWarning !== true
    ) {
      warnForExtraAttributes(extraAttributeNames);
    }
  }

  return updatePayload;
}

export function diffHydratedText(
  textNode: Text,
  text: string,
  isConcurrentMode: boolean,
): boolean {
  const isDifferent = textNode.nodeValue !== text;
  return isDifferent;
}

export function warnForDeletedHydratableElement(
  parentNode: Element | Document | DocumentFragment,
  child: Element,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    console.error(
      'Did not expect server HTML to contain a <%s> in <%s>.',
      child.nodeName.toLowerCase(),
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function warnForDeletedHydratableText(
  parentNode: Element | Document | DocumentFragment,
  child: Text,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    console.error(
      'Did not expect server HTML to contain the text node "%s" in <%s>.',
      child.nodeValue,
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function warnForInsertedHydratedElement(
  parentNode: Element | Document | DocumentFragment,
  tag: string,
  props: Object,
) {
  if (__DEV__) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    console.error(
      'Expected server HTML to contain a matching <%s> in <%s>.',
      tag,
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function warnForInsertedHydratedText(
  parentNode: Element | Document | DocumentFragment,
  text: string,
) {
  if (__DEV__) {
    if (text === '') {
      // We expect to insert empty text nodes since they're not represented in
      // the HTML.
      // TODO: Remove this special case if we can just avoid inserting empty
      // text nodes.
      return;
    }
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    console.error(
      'Expected server HTML to contain a matching text node for "%s" in <%s>.',
      text,
      parentNode.nodeName.toLowerCase(),
    );
  }
}

export function restoreControlledState(
  domElement: Element,
  tag: string,
  props: Object,
): void {
  switch (tag) {
    case 'input':
      ReactDOMInputRestoreControlledState(domElement, props);
      return;
    case 'textarea':
      ReactDOMTextareaRestoreControlledState(domElement, props);
      return;
    case 'select':
      ReactDOMSelectRestoreControlledState(domElement, props);
      return;
  }
}
