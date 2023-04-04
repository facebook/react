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
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';

import {
  getValueForAttribute,
  getValueForAttributeOnCustomComponent,
  setValueForPropertyOnCustomComponent,
  setValueForAttribute,
  setValueForNamespacedAttribute,
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
import isCustomElement from '../shared/isCustomElement';
import possibleStandardNames from '../shared/possibleStandardNames';
import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';
import sanitizeURL from '../shared/sanitizeURL';

import {
  enableCustomElementPropertySupport,
  enableClientRenderFallbackOnTextMismatch,
  enableHostSingletons,
  disableIEWorkarounds,
  enableTrustedTypesIntegration,
  enableFilterEmptyStringAttributesDOM,
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
    if (serverValue === clientValue) {
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

const xlinkNamespace = 'http://www.w3.org/1999/xlink';
const xmlNamespace = 'http://www.w3.org/XML/1998/namespace';

function setProp(
  domElement: Element,
  tag: string,
  key: string,
  value: mixed,
  props: any,
): void {
  switch (key) {
    case 'style': {
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
    // These attributes accept URLs. These must not allow javascript: URLS.
    case 'src':
    case 'href':
    case 'action':
      if (enableFilterEmptyStringAttributesDOM) {
        if (value === '') {
          if (__DEV__) {
            if (key === 'src') {
              console.error(
                'An empty string ("") was passed to the %s attribute. ' +
                  'This may cause the browser to download the whole page again over the network. ' +
                  'To fix this, either do not render the element at all ' +
                  'or pass null to %s instead of an empty string.',
                key,
                key,
              );
            } else {
              console.error(
                'An empty string ("") was passed to the %s attribute. ' +
                  'To fix this, either do not render the element at all ' +
                  'or pass null to %s instead of an empty string.',
                key,
                key,
              );
            }
          }
          domElement.removeAttribute(key);
          break;
        }
      }
    // Fall through to the last case which shouldn't remove empty strings.
    // eslint-disable-next-line no-fallthrough
    case 'formAction': {
      if (
        value == null ||
        typeof value === 'function' ||
        typeof value === 'symbol' ||
        typeof value === 'boolean'
      ) {
        domElement.removeAttribute(key);
        break;
      }
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      if (__DEV__) {
        checkAttributeStringCoercion(value, key);
      }
      const sanitizedValue = (sanitizeURL(
        enableTrustedTypesIntegration ? value : '' + (value: any),
      ): any);
      domElement.setAttribute(key, sanitizedValue);
      break;
    }
    case 'xlinkHref': {
      if (
        value == null ||
        typeof value === 'function' ||
        typeof value === 'boolean' ||
        typeof value === 'symbol'
      ) {
        domElement.removeAttribute('xlink:href');
        break;
      }
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      if (__DEV__) {
        checkAttributeStringCoercion(value, key);
      }
      const sanitizedValue = (sanitizeURL(
        enableTrustedTypesIntegration ? value : '' + (value: any),
      ): any);
      domElement.setAttributeNS(xlinkNamespace, 'xlink:href', sanitizedValue);
      break;
    }
    case 'contentEditable':
    case 'spellCheck':
    case 'draggable':
    case 'value':
    case 'autoReverse':
    case 'externalResourcesRequired':
    case 'focusable':
    case 'preserveAlpha': {
      // Booleanish String
      // These are "enumerated" attributes that accept "true" and "false".
      // In React, we let users pass `true` and `false` even though technically
      // these aren't boolean attributes (they are coerced to strings).
      // The SVG attributes are case-sensitive. Since the HTML attributes are
      // insensitive they also work even though we canonically use lower case.
      if (
        value != null &&
        typeof value !== 'function' &&
        typeof value !== 'symbol'
      ) {
        if (__DEV__) {
          checkAttributeStringCoercion(value, key);
        }
        domElement.setAttribute(key, (value: any));
      } else {
        domElement.removeAttribute(key);
      }
      break;
    }
    // Boolean
    case 'allowFullScreen':
    case 'async':
    case 'autoPlay':
    case 'controls':
    case 'default':
    case 'defer':
    case 'disabled':
    case 'disablePictureInPicture':
    case 'disableRemotePlayback':
    case 'formNoValidate':
    case 'hidden':
    case 'loop':
    case 'noModule':
    case 'noValidate':
    case 'open':
    case 'playsInline':
    case 'readOnly':
    case 'required':
    case 'reversed':
    case 'scoped':
    case 'seamless':
    case 'itemScope': {
      if (value && typeof value !== 'function' && typeof value !== 'symbol') {
        domElement.setAttribute(key, '');
      } else {
        domElement.removeAttribute(key);
      }
      break;
    }
    // Overloaded Boolean
    case 'capture':
    case 'download': {
      // An attribute that can be used as a flag as well as with a value.
      // When true, it should be present (set either to an empty string or its name).
      // When false, it should be omitted.
      // For any other value, should be present with that value.
      if (value === true) {
        domElement.setAttribute(key, '');
      } else if (
        value !== false &&
        value != null &&
        typeof value !== 'function' &&
        typeof value !== 'symbol'
      ) {
        if (__DEV__) {
          checkAttributeStringCoercion(value, key);
        }
        domElement.setAttribute(key, (value: any));
      } else {
        domElement.removeAttribute(key);
      }
      break;
    }
    case 'cols':
    case 'rows':
    case 'size':
    case 'span': {
      // These are HTML attributes that must be positive numbers.
      if (
        value != null &&
        typeof value !== 'function' &&
        typeof value !== 'symbol' &&
        !isNaN(value) &&
        (value: any) >= 1
      ) {
        if (__DEV__) {
          checkAttributeStringCoercion(value, key);
        }
        domElement.setAttribute(key, (value: any));
      } else {
        domElement.removeAttribute(key);
      }
      break;
    }
    case 'rowSpan':
    case 'start': {
      // These are HTML attributes that must be numbers.
      if (
        value != null &&
        typeof value !== 'function' &&
        typeof value !== 'symbol' &&
        !isNaN(value)
      ) {
        if (__DEV__) {
          checkAttributeStringCoercion(value, key);
        }
        domElement.setAttribute(key, (value: any));
      } else {
        domElement.removeAttribute(key);
      }
      break;
    }
    // A few React string attributes have a different name.
    // This is a mapping from React prop names to the attribute names.
    case 'acceptCharset':
      setValueForAttribute(domElement, 'accept-charset', value);
      break;
    case 'className':
      setValueForAttribute(domElement, 'class', value);
      break;
    case 'htmlFor':
      setValueForAttribute(domElement, 'for', value);
      break;
    case 'httpEquiv':
      setValueForAttribute(domElement, 'http-equiv', value);
      break;
    // HTML and SVG attributes, but the SVG attribute is case sensitive.
    case 'tabIndex':
      setValueForAttribute(domElement, 'tabindex', value);
      break;
    case 'crossOrigin':
      setValueForAttribute(domElement, 'crossorigin', value);
      break;
    // This is a list of all SVG attributes that need special casing.
    // Regular attributes that just accept strings.
    case 'accentHeight':
      setValueForAttribute(domElement, 'accent-height', value);
      break;
    case 'alignmentBaseline':
      setValueForAttribute(domElement, 'alignment-baseline', value);
      break;
    case 'arabicForm':
      setValueForAttribute(domElement, 'arabic-form', value);
      break;
    case 'baselineShift':
      setValueForAttribute(domElement, 'baseline-shift', value);
      break;
    case 'capHeight':
      setValueForAttribute(domElement, 'cap-height', value);
      break;
    case 'clipPath':
      setValueForAttribute(domElement, 'clip-path', value);
      break;
    case 'clipRule':
      setValueForAttribute(domElement, 'clip-rule', value);
      break;
    case 'colorInterpolation':
      setValueForAttribute(domElement, 'color-interpolation', value);
      break;
    case 'colorInterpolationFilters':
      setValueForAttribute(domElement, 'color-interpolation-filters', value);
      break;
    case 'colorProfile':
      setValueForAttribute(domElement, 'color-profile', value);
      break;
    case 'colorRendering':
      setValueForAttribute(domElement, 'color-rendering', value);
      break;
    case 'dominantBaseline':
      setValueForAttribute(domElement, 'dominant-baseline', value);
      break;
    case 'enableBackground':
      setValueForAttribute(domElement, 'enable-background', value);
      break;
    case 'fillOpacity':
      setValueForAttribute(domElement, 'fill-opacity', value);
      break;
    case 'fillRule':
      setValueForAttribute(domElement, 'fill-rule', value);
      break;
    case 'floodColor':
      setValueForAttribute(domElement, 'flood-color', value);
      break;
    case 'floodOpacity':
      setValueForAttribute(domElement, 'flood-opacity', value);
      break;
    case 'fontFamily':
      setValueForAttribute(domElement, 'font-family', value);
      break;
    case 'fontSize':
      setValueForAttribute(domElement, 'font-size', value);
      break;
    case 'fontSizeAdjust':
      setValueForAttribute(domElement, 'font-size-adjust', value);
      break;
    case 'fontStretch':
      setValueForAttribute(domElement, 'font-stretch', value);
      break;
    case 'fontStyle':
      setValueForAttribute(domElement, 'font-style', value);
      break;
    case 'fontVariant':
      setValueForAttribute(domElement, 'font-variant', value);
      break;
    case 'fontWeight':
      setValueForAttribute(domElement, 'font-weight', value);
      break;
    case 'glyphName':
      setValueForAttribute(domElement, 'glyph-name', value);
      break;
    case 'glyphOrientationHorizontal':
      setValueForAttribute(domElement, 'glyph-orientation-horizontal', value);
      break;
    case 'glyphOrientationVertical':
      setValueForAttribute(domElement, 'glyph-orientation-vertical', value);
      break;
    case 'horizAdvX':
      setValueForAttribute(domElement, 'horiz-adv-x', value);
      break;
    case 'horizOriginX':
      setValueForAttribute(domElement, 'horiz-origin-x', value);
      break;
    case 'imageRendering':
      setValueForAttribute(domElement, 'image-rendering', value);
      break;
    case 'letterSpacing':
      setValueForAttribute(domElement, 'letter-spacing', value);
      break;
    case 'lightingColor':
      setValueForAttribute(domElement, 'lighting-color', value);
      break;
    case 'markerEnd':
      setValueForAttribute(domElement, 'marker-end', value);
      break;
    case 'markerMid':
      setValueForAttribute(domElement, 'marker-mid', value);
      break;
    case 'markerStart':
      setValueForAttribute(domElement, 'marker-start', value);
      break;
    case 'overlinePosition':
      setValueForAttribute(domElement, 'overline-position', value);
      break;
    case 'overlineThickness':
      setValueForAttribute(domElement, 'overline-thickness', value);
      break;
    case 'paintOrder':
      setValueForAttribute(domElement, 'paint-order', value);
      break;
    case 'panose-1':
      setValueForAttribute(domElement, 'panose-1', value);
      break;
    case 'pointerEvents':
      setValueForAttribute(domElement, 'pointer-events', value);
      break;
    case 'renderingIntent':
      setValueForAttribute(domElement, 'rendering-intent', value);
      break;
    case 'shapeRendering':
      setValueForAttribute(domElement, 'shape-rendering', value);
      break;
    case 'stopColor':
      setValueForAttribute(domElement, 'stop-color', value);
      break;
    case 'stopOpacity':
      setValueForAttribute(domElement, 'stop-opacity', value);
      break;
    case 'strikethroughPosition':
      setValueForAttribute(domElement, 'strikethrough-position', value);
      break;
    case 'strikethroughThickness':
      setValueForAttribute(domElement, 'strikethrough-thickness', value);
      break;
    case 'strokeDasharray':
      setValueForAttribute(domElement, 'stroke-dasharray', value);
      break;
    case 'strokeDashoffset':
      setValueForAttribute(domElement, 'stroke-dashoffset', value);
      break;
    case 'strokeLinecap':
      setValueForAttribute(domElement, 'stroke-linecap', value);
      break;
    case 'strokeLinejoin':
      setValueForAttribute(domElement, 'stroke-linejoin', value);
      break;
    case 'strokeMiterlimit':
      setValueForAttribute(domElement, 'stroke-miterlimit', value);
      break;
    case 'strokeOpacity':
      setValueForAttribute(domElement, 'stroke-opacity', value);
      break;
    case 'strokeWidth':
      setValueForAttribute(domElement, 'stroke-width', value);
      break;
    case 'textAnchor':
      setValueForAttribute(domElement, 'text-anchor', value);
      break;
    case 'textDecoration':
      setValueForAttribute(domElement, 'text-decoration', value);
      break;
    case 'textRendering':
      setValueForAttribute(domElement, 'text-rendering', value);
      break;
    case 'transformOrigin':
      setValueForAttribute(domElement, 'transform-origin', value);
      break;
    case 'underlinePosition':
      setValueForAttribute(domElement, 'underline-position', value);
      break;
    case 'underlineThickness':
      setValueForAttribute(domElement, 'underline-thickness', value);
      break;
    case 'unicodeBidi':
      setValueForAttribute(domElement, 'unicode-bidi', value);
      break;
    case 'unicodeRange':
      setValueForAttribute(domElement, 'unicode-range', value);
      break;
    case 'unitsPerEm':
      setValueForAttribute(domElement, 'units-per-em', value);
      break;
    case 'vAlphabetic':
      setValueForAttribute(domElement, 'v-alphabetic', value);
      break;
    case 'vHanging':
      setValueForAttribute(domElement, 'v-hanging', value);
      break;
    case 'vIdeographic':
      setValueForAttribute(domElement, 'v-ideographic', value);
      break;
    case 'vMathematical':
      setValueForAttribute(domElement, 'v-mathematical', value);
      break;
    case 'vectorEffect':
      setValueForAttribute(domElement, 'vector-effect', value);
      break;
    case 'vertAdvY':
      setValueForAttribute(domElement, 'vert-adv-y', value);
      break;
    case 'vertOriginX':
      setValueForAttribute(domElement, 'vert-origin-x', value);
      break;
    case 'vertOriginY':
      setValueForAttribute(domElement, 'vert-origin-y', value);
      break;
    case 'wordSpacing':
      setValueForAttribute(domElement, 'word-spacing', value);
      break;
    case 'writingMode':
      setValueForAttribute(domElement, 'writing-mode', value);
      break;
    case 'xmlnsXlink':
      setValueForAttribute(domElement, 'xmlns:xlink', value);
      break;
    case 'xHeight':
      setValueForAttribute(domElement, 'x-height', value);
      break;
    case 'xlinkActuate':
      setValueForNamespacedAttribute(
        domElement,
        xlinkNamespace,
        'xlink:actuate',
        value,
      );
      break;
    case 'xlinkArcrole':
      setValueForNamespacedAttribute(
        domElement,
        xlinkNamespace,
        'xlink:arcrole',
        value,
      );
      break;
    case 'xlinkRole':
      setValueForNamespacedAttribute(
        domElement,
        xlinkNamespace,
        'xlink:role',
        value,
      );
      break;
    case 'xlinkShow':
      setValueForNamespacedAttribute(
        domElement,
        xlinkNamespace,
        'xlink:show',
        value,
      );
      break;
    case 'xlinkTitle':
      setValueForNamespacedAttribute(
        domElement,
        xlinkNamespace,
        'xlink:title',
        value,
      );
      break;
    case 'xlinkType':
      setValueForNamespacedAttribute(
        domElement,
        xlinkNamespace,
        'xlink:type',
        value,
      );
      break;
    case 'xmlBase':
      setValueForNamespacedAttribute(
        domElement,
        xmlNamespace,
        'xml:base',
        value,
      );
      break;
    case 'xmlLang':
      setValueForNamespacedAttribute(
        domElement,
        xmlNamespace,
        'xml:lang',
        value,
      );
      break;
    case 'xmlSpace':
      setValueForNamespacedAttribute(
        domElement,
        xmlNamespace,
        'xml:space',
        value,
      );
      break;
    // Properties that should not be allowed on custom elements.
    case 'innerText':
    case 'textContent':
      if (enableCustomElementPropertySupport) {
        break;
      }
    // eslint-disable-next-line no-fallthrough
    default: {
      if (
        key.length > 2 &&
        (key[0] === 'o' || key[0] === 'O') &&
        (key[1] === 'n' || key[1] === 'N')
      ) {
        if (
          __DEV__ &&
          registrationNameDependencies.hasOwnProperty(key) &&
          value != null &&
          typeof value !== 'function'
        ) {
          warnForInvalidEventListener(key, value);
        }
      } else {
        setValueForAttribute(domElement, key, value);
      }
    }
  }
}

function setPropOnCustomElement(
  domElement: Element,
  tag: string,
  key: string,
  value: mixed,
  props: any,
): void {
  switch (key) {
    case 'style': {
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
        setTextContent(domElement, value);
      } else if (typeof value === 'number') {
        setTextContent(domElement, '' + value);
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
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'innerHTML': {
      // Noop
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
        if (enableCustomElementPropertySupport) {
          setValueForPropertyOnCustomComponent(domElement, key, value);
        } else {
          if (typeof value === 'boolean') {
            // Special case before the new flag is on
            value = '' + (value: any);
          }
          setValueForAttribute(domElement, key, value);
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
            setProp(domElement, tag, propKey, propValue, props);
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
            setProp(domElement, tag, propKey, propValue, props);
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
            setProp(domElement, tag, propKey, propValue, props);
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
            setProp(domElement, tag, propKey, propValue, props);
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
            setProp(domElement, tag, propKey, propValue, props);
          }
        }
      }
      return;
    }
  }

  if (isCustomElement(tag, props)) {
    for (const propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      setPropOnCustomElement(domElement, tag, propKey, propValue, props);
    }
  } else {
    for (const propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      setProp(domElement, tag, propKey, propValue, props);
    }
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
            setProp(domElement, tag, propKey, propValue, nextProps);
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
            setProp(domElement, tag, propKey, propValue, nextProps);
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
            setProp(domElement, tag, propKey, propValue, nextProps);
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
            setProp(domElement, tag, propKey, propValue, nextProps);
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
            setProp(domElement, tag, propKey, propValue, nextProps);
          }
        }
      }
      return;
    }
  }

  // Apply the diff.
  if (isCustomElement(tag, nextProps)) {
    for (let i = 0; i < updatePayload.length; i += 2) {
      const propKey = updatePayload[i];
      const propValue = updatePayload[i + 1];
      setPropOnCustomElement(domElement, tag, propKey, propValue, nextProps);
    }
  } else {
    for (let i = 0; i < updatePayload.length; i += 2) {
      const propKey = updatePayload[i];
      const propValue = updatePayload[i + 1];
      setProp(domElement, tag, propKey, propValue, nextProps);
    }
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
    warnForPropDifference('style', serverValue, expectedStyle);
  }
}

function hydrateAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        return;
    }
  } else {
    if (value == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
    } else {
      switch (typeof value) {
        case 'function':
        case 'symbol':
        case 'boolean':
          break;
        default: {
          if (__DEV__) {
            checkAttributeStringCoercion(value, propKey);
          }
          if (serverValue === '' + value) {
            return;
          }
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function hydrateBooleanAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'function':
      case 'symbol':
        return;
    }
    if (!value) {
      return;
    }
  } else {
    switch (typeof value) {
      case 'function':
      case 'symbol':
        break;
      default: {
        if (value) {
          // If this was a boolean, it doesn't matter what the value is
          // the fact that we have it is the same as the expected.
          // As long as it's positive.
          return;
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function hydrateOverloadedBooleanAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
        return;
      default:
        if (value === false) {
          return;
        }
    }
  } else {
    if (value == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
    } else {
      switch (typeof value) {
        case 'function':
        case 'symbol':
          break;
        case 'boolean':
          if (value === true && serverValue === '') {
            return;
          }
          break;
        default: {
          if (__DEV__) {
            checkAttributeStringCoercion(value, propKey);
          }
          if (serverValue === '' + value) {
            return;
          }
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function hydrateBooleanishAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
        return;
    }
  } else {
    if (value == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
    } else {
      switch (typeof value) {
        case 'function':
        case 'symbol':
          break;
        default: {
          if (__DEV__) {
            checkAttributeStringCoercion(value, attributeName);
          }
          if (serverValue === '' + (value: any)) {
            return;
          }
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function hydrateNumericAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        return;
      default:
        if (isNaN(value)) {
          return;
        }
    }
  } else {
    if (value == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
    } else {
      switch (typeof value) {
        case 'function':
        case 'symbol':
        case 'boolean':
          break;
        default: {
          if (isNaN(value)) {
            // We had an attribute but shouldn't have had one, so read it
            // for the error message.
            break;
          }
          if (__DEV__) {
            checkAttributeStringCoercion(value, propKey);
          }
          if (serverValue === '' + value) {
            return;
          }
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function hydratePositiveNumericAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        return;
      default:
        if (isNaN(value) || value < 1) {
          return;
        }
    }
  } else {
    if (value == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
    } else {
      switch (typeof value) {
        case 'function':
        case 'symbol':
        case 'boolean':
          break;
        default: {
          if (isNaN(value) || value < 1) {
            // We had an attribute but shouldn't have had one, so read it
            // for the error message.
            break;
          }
          if (__DEV__) {
            checkAttributeStringCoercion(value, propKey);
          }
          if (serverValue === '' + value) {
            return;
          }
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function hydrateSanitizedAttribute(
  domElement: Element,
  propKey: string,
  attributeName: string,
  value: any,
  extraAttributes: Set<string>,
): void {
  extraAttributes.delete(attributeName);
  const serverValue = domElement.getAttribute(attributeName);
  if (serverValue === null) {
    switch (typeof value) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        return;
    }
  } else {
    if (value == null) {
      // We had an attribute but shouldn't have had one, so read it
      // for the error message.
    } else {
      switch (typeof value) {
        case 'function':
        case 'symbol':
        case 'boolean':
          break;
        default: {
          if (__DEV__) {
            checkAttributeStringCoercion(value, propKey);
          }
          const sanitizedValue = sanitizeURL('' + value);
          if (serverValue === sanitizedValue) {
            return;
          }
        }
      }
    }
  }
  warnForPropDifference(propKey, serverValue, value);
}

function diffHydratedCustomComponent(
  domElement: Element,
  tag: string,
  props: Object,
  parentNamespaceDev: string,
  extraAttributes: Set<string>,
) {
  for (const propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    const value = props[propKey];
    if (value == null) {
      continue;
    }
    if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (typeof value !== 'function') {
        warnForInvalidEventListener(propKey, value);
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
        const nextHtml = value ? value.__html : undefined;
        if (nextHtml != null) {
          const expectedHTML = normalizeHTML(domElement, nextHtml);
          warnForPropDifference(propKey, serverHTML, expectedHTML);
        }
        continue;
      case 'style':
        extraAttributes.delete(propKey);
        diffHydratedStyles(domElement, value);
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
          extraAttributes.delete(propKey.toLowerCase());
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
          extraAttributes.delete('class');
          const serverValue = getValueForAttributeOnCustomComponent(
            domElement,
            'class',
            value,
          );
          warnForPropDifference('className', serverValue, value);
          continue;
        }
      // eslint-disable-next-line no-fallthrough
      default: {
        let ownNamespaceDev = parentNamespaceDev;
        if (ownNamespaceDev === HTML_NAMESPACE) {
          ownNamespaceDev = getIntrinsicNamespace(tag);
        }
        if (ownNamespaceDev === HTML_NAMESPACE) {
          extraAttributes.delete(propKey.toLowerCase());
        } else {
          extraAttributes.delete(propKey);
        }
        const serverValue = getValueForAttributeOnCustomComponent(
          domElement,
          propKey,
          value,
        );
        warnForPropDifference(propKey, serverValue, value);
      }
    }
  }
}

function diffHydratedGenericElement(
  domElement: Element,
  tag: string,
  props: Object,
  parentNamespaceDev: string,
  extraAttributes: Set<string>,
) {
  for (const propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    const value = props[propKey];
    if (value == null) {
      continue;
    }
    if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (typeof value !== 'function') {
        warnForInvalidEventListener(propKey, value);
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
        const nextHtml = value ? value.__html : undefined;
        if (nextHtml != null) {
          const expectedHTML = normalizeHTML(domElement, nextHtml);
          warnForPropDifference(propKey, serverHTML, expectedHTML);
        }
        continue;
      case 'style':
        extraAttributes.delete(propKey);
        diffHydratedStyles(domElement, value);
        continue;
      case 'multiple': {
        extraAttributes.delete(propKey);
        const serverValue = (domElement: any).multiple;
        warnForPropDifference(propKey, serverValue, value);
        continue;
      }
      case 'muted': {
        extraAttributes.delete(propKey);
        const serverValue = (domElement: any).muted;
        warnForPropDifference(propKey, serverValue, value);
        continue;
      }
      case 'autoFocus': {
        extraAttributes.delete('autofocus');
        const serverValue = (domElement: any).autofocus;
        warnForPropDifference(propKey, serverValue, value);
        continue;
      }
      case 'src':
      case 'href':
      case 'action':
        if (enableFilterEmptyStringAttributesDOM) {
          if (value === '') {
            if (__DEV__) {
              if (propKey === 'src') {
                console.error(
                  'An empty string ("") was passed to the %s attribute. ' +
                    'This may cause the browser to download the whole page again over the network. ' +
                    'To fix this, either do not render the element at all ' +
                    'or pass null to %s instead of an empty string.',
                  propKey,
                  propKey,
                );
              } else {
                console.error(
                  'An empty string ("") was passed to the %s attribute. ' +
                    'To fix this, either do not render the element at all ' +
                    'or pass null to %s instead of an empty string.',
                  propKey,
                  propKey,
                );
              }
            }
            hydrateSanitizedAttribute(
              domElement,
              propKey,
              propKey,
              null,
              extraAttributes,
            );
            continue;
          }
        }
        hydrateSanitizedAttribute(
          domElement,
          propKey,
          propKey,
          value,
          extraAttributes,
        );
        continue;
      case 'formAction':
        hydrateSanitizedAttribute(
          domElement,
          propKey,
          'formaction',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkHref':
        hydrateSanitizedAttribute(
          domElement,
          propKey,
          'xlink:href',
          value,
          extraAttributes,
        );
        continue;
      case 'contentEditable': {
        // Lower-case Booleanish String
        hydrateBooleanishAttribute(
          domElement,
          propKey,
          'contenteditable',
          value,
          extraAttributes,
        );
        continue;
      }
      case 'spellCheck': {
        // Lower-case Booleanish String
        hydrateBooleanishAttribute(
          domElement,
          propKey,
          'spellcheck',
          value,
          extraAttributes,
        );
        continue;
      }
      case 'draggable':
      case 'autoReverse':
      case 'externalResourcesRequired':
      case 'focusable':
      case 'preserveAlpha': {
        // Case-sensitive Booleanish String
        hydrateBooleanishAttribute(
          domElement,
          propKey,
          propKey,
          value,
          extraAttributes,
        );
        continue;
      }
      case 'allowFullScreen':
      case 'async':
      case 'autoPlay':
      case 'controls':
      case 'default':
      case 'defer':
      case 'disabled':
      case 'disablePictureInPicture':
      case 'disableRemotePlayback':
      case 'formNoValidate':
      case 'hidden':
      case 'loop':
      case 'noModule':
      case 'noValidate':
      case 'open':
      case 'playsInline':
      case 'readOnly':
      case 'required':
      case 'reversed':
      case 'scoped':
      case 'seamless':
      case 'itemScope': {
        // Some of these need to be lower case to remove them from the extraAttributes list.
        hydrateBooleanAttribute(
          domElement,
          propKey,
          propKey.toLowerCase(),
          value,
          extraAttributes,
        );
        continue;
      }
      case 'capture':
      case 'download': {
        hydrateOverloadedBooleanAttribute(
          domElement,
          propKey,
          propKey,
          value,
          extraAttributes,
        );
        continue;
      }
      case 'cols':
      case 'rows':
      case 'size':
      case 'span': {
        hydratePositiveNumericAttribute(
          domElement,
          propKey,
          propKey,
          value,
          extraAttributes,
        );
        continue;
      }
      case 'rowSpan': {
        hydrateNumericAttribute(
          domElement,
          propKey,
          'rowspan',
          value,
          extraAttributes,
        );
        continue;
      }
      case 'start': {
        hydrateNumericAttribute(
          domElement,
          propKey,
          propKey,
          value,
          extraAttributes,
        );
        continue;
      }
      // A few React string attributes have a different name.
      // This is a mapping from React prop names to the attribute names.
      case 'acceptCharset':
        hydrateAttribute(
          domElement,
          propKey,
          'accept-charset',
          value,
          extraAttributes,
        );
        continue;
      case 'className':
        hydrateAttribute(domElement, propKey, 'class', value, extraAttributes);
        continue;
      case 'htmlFor':
        hydrateAttribute(domElement, propKey, 'for', value, extraAttributes);
        continue;
      case 'httpEquiv':
        hydrateAttribute(
          domElement,
          propKey,
          'http-equiv',
          value,
          extraAttributes,
        );
        continue;
      case 'tabIndex':
        hydrateAttribute(
          domElement,
          propKey,
          'tabindex',
          value,
          extraAttributes,
        );
        continue;
      case 'crossOrigin':
        hydrateAttribute(
          domElement,
          propKey,
          'crossorigin',
          value,
          extraAttributes,
        );
        continue;
      case 'accentHeight':
        hydrateAttribute(
          domElement,
          propKey,
          'accent-height',
          value,
          extraAttributes,
        );
        continue;
      case 'alignmentBaseline':
        hydrateAttribute(
          domElement,
          propKey,
          'alignment-baseline',
          value,
          extraAttributes,
        );
        continue;
      case 'arabicForm':
        hydrateAttribute(
          domElement,
          propKey,
          'arabic-form',
          value,
          extraAttributes,
        );
        continue;
      case 'baselineShift':
        hydrateAttribute(
          domElement,
          propKey,
          'baseline-shift',
          value,
          extraAttributes,
        );
        continue;
      case 'capHeight':
        hydrateAttribute(
          domElement,
          propKey,
          'cap-height',
          value,
          extraAttributes,
        );
        continue;
      case 'clipPath':
        hydrateAttribute(
          domElement,
          propKey,
          'clip-path',
          value,
          extraAttributes,
        );
        continue;
      case 'clipRule':
        hydrateAttribute(
          domElement,
          propKey,
          'clip-rule',
          value,
          extraAttributes,
        );
        continue;
      case 'colorInterpolation':
        hydrateAttribute(
          domElement,
          propKey,
          'color-interpolation',
          value,
          extraAttributes,
        );
        continue;
      case 'colorInterpolationFilters':
        hydrateAttribute(
          domElement,
          propKey,
          'color-interpolation-filters',
          value,
          extraAttributes,
        );
        continue;
      case 'colorProfile':
        hydrateAttribute(
          domElement,
          propKey,
          'color-profile',
          value,
          extraAttributes,
        );
        continue;
      case 'colorRendering':
        hydrateAttribute(
          domElement,
          propKey,
          'color-rendering',
          value,
          extraAttributes,
        );
        continue;
      case 'dominantBaseline':
        hydrateAttribute(
          domElement,
          propKey,
          'dominant-baseline',
          value,
          extraAttributes,
        );
        continue;
      case 'enableBackground':
        hydrateAttribute(
          domElement,
          propKey,
          'enable-background',
          value,
          extraAttributes,
        );
        continue;
      case 'fillOpacity':
        hydrateAttribute(
          domElement,
          propKey,
          'fill-opacity',
          value,
          extraAttributes,
        );
        continue;
      case 'fillRule':
        hydrateAttribute(
          domElement,
          propKey,
          'fill-rule',
          value,
          extraAttributes,
        );
        continue;
      case 'floodColor':
        hydrateAttribute(
          domElement,
          propKey,
          'flood-color',
          value,
          extraAttributes,
        );
        continue;
      case 'floodOpacity':
        hydrateAttribute(
          domElement,
          propKey,
          'flood-opacity',
          value,
          extraAttributes,
        );
        continue;
      case 'fontFamily':
        hydrateAttribute(
          domElement,
          propKey,
          'font-family',
          value,
          extraAttributes,
        );
        continue;
      case 'fontSize':
        hydrateAttribute(
          domElement,
          propKey,
          'font-size',
          value,
          extraAttributes,
        );
        continue;
      case 'fontSizeAdjust':
        hydrateAttribute(
          domElement,
          propKey,
          'font-size-adjust',
          value,
          extraAttributes,
        );
        continue;
      case 'fontStretch':
        hydrateAttribute(
          domElement,
          propKey,
          'font-stretch',
          value,
          extraAttributes,
        );
        continue;
      case 'fontStyle':
        hydrateAttribute(
          domElement,
          propKey,
          'font-style',
          value,
          extraAttributes,
        );
        continue;
      case 'fontVariant':
        hydrateAttribute(
          domElement,
          propKey,
          'font-variant',
          value,
          extraAttributes,
        );
        continue;
      case 'fontWeight':
        hydrateAttribute(
          domElement,
          propKey,
          'font-weight',
          value,
          extraAttributes,
        );
        continue;
      case 'glyphName':
        hydrateAttribute(
          domElement,
          propKey,
          'glyph-name',
          value,
          extraAttributes,
        );
        continue;
      case 'glyphOrientationHorizontal':
        hydrateAttribute(
          domElement,
          propKey,
          'glyph-orientation-horizontal',
          value,
          extraAttributes,
        );
        continue;
      case 'glyphOrientationVertical':
        hydrateAttribute(
          domElement,
          propKey,
          'glyph-orientation-vertical',
          value,
          extraAttributes,
        );
        continue;
      case 'horizAdvX':
        hydrateAttribute(
          domElement,
          propKey,
          'horiz-adv-x',
          value,
          extraAttributes,
        );
        continue;
      case 'horizOriginX':
        hydrateAttribute(
          domElement,
          propKey,
          'horiz-origin-x',
          value,
          extraAttributes,
        );
        continue;
      case 'imageRendering':
        hydrateAttribute(
          domElement,
          propKey,
          'image-rendering',
          value,
          extraAttributes,
        );
        continue;
      case 'letterSpacing':
        hydrateAttribute(
          domElement,
          propKey,
          'letter-spacing',
          value,
          extraAttributes,
        );
        continue;
      case 'lightingColor':
        hydrateAttribute(
          domElement,
          propKey,
          'lighting-color',
          value,
          extraAttributes,
        );
        continue;
      case 'markerEnd':
        hydrateAttribute(
          domElement,
          propKey,
          'marker-end',
          value,
          extraAttributes,
        );
        continue;
      case 'markerMid':
        hydrateAttribute(
          domElement,
          propKey,
          'marker-mid',
          value,
          extraAttributes,
        );
        continue;
      case 'markerStart':
        hydrateAttribute(
          domElement,
          propKey,
          'marker-start',
          value,
          extraAttributes,
        );
        continue;
      case 'overlinePosition':
        hydrateAttribute(
          domElement,
          propKey,
          'overline-position',
          value,
          extraAttributes,
        );
        continue;
      case 'overlineThickness':
        hydrateAttribute(
          domElement,
          propKey,
          'overline-thickness',
          value,
          extraAttributes,
        );
        continue;
      case 'paintOrder':
        hydrateAttribute(
          domElement,
          propKey,
          'paint-order',
          value,
          extraAttributes,
        );
        continue;
      case 'panose-1':
        hydrateAttribute(
          domElement,
          propKey,
          'panose-1',
          value,
          extraAttributes,
        );
        continue;
      case 'pointerEvents':
        hydrateAttribute(
          domElement,
          propKey,
          'pointer-events',
          value,
          extraAttributes,
        );
        continue;
      case 'renderingIntent':
        hydrateAttribute(
          domElement,
          propKey,
          'rendering-intent',
          value,
          extraAttributes,
        );
        continue;
      case 'shapeRendering':
        hydrateAttribute(
          domElement,
          propKey,
          'shape-rendering',
          value,
          extraAttributes,
        );
        continue;
      case 'stopColor':
        hydrateAttribute(
          domElement,
          propKey,
          'stop-color',
          value,
          extraAttributes,
        );
        continue;
      case 'stopOpacity':
        hydrateAttribute(
          domElement,
          propKey,
          'stop-opacity',
          value,
          extraAttributes,
        );
        continue;
      case 'strikethroughPosition':
        hydrateAttribute(
          domElement,
          propKey,
          'strikethrough-position',
          value,
          extraAttributes,
        );
        continue;
      case 'strikethroughThickness':
        hydrateAttribute(
          domElement,
          propKey,
          'strikethrough-thickness',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeDasharray':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-dasharray',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeDashoffset':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-dashoffset',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeLinecap':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-linecap',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeLinejoin':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-linejoin',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeMiterlimit':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-miterlimit',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeOpacity':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-opacity',
          value,
          extraAttributes,
        );
        continue;
      case 'strokeWidth':
        hydrateAttribute(
          domElement,
          propKey,
          'stroke-width',
          value,
          extraAttributes,
        );
        continue;
      case 'textAnchor':
        hydrateAttribute(
          domElement,
          propKey,
          'text-anchor',
          value,
          extraAttributes,
        );
        continue;
      case 'textDecoration':
        hydrateAttribute(
          domElement,
          propKey,
          'text-decoration',
          value,
          extraAttributes,
        );
        continue;
      case 'textRendering':
        hydrateAttribute(
          domElement,
          propKey,
          'text-rendering',
          value,
          extraAttributes,
        );
        continue;
      case 'transformOrigin':
        hydrateAttribute(
          domElement,
          propKey,
          'transform-origin',
          value,
          extraAttributes,
        );
        continue;
      case 'underlinePosition':
        hydrateAttribute(
          domElement,
          propKey,
          'underline-position',
          value,
          extraAttributes,
        );
        continue;
      case 'underlineThickness':
        hydrateAttribute(
          domElement,
          propKey,
          'underline-thickness',
          value,
          extraAttributes,
        );
        continue;
      case 'unicodeBidi':
        hydrateAttribute(
          domElement,
          propKey,
          'unicode-bidi',
          value,
          extraAttributes,
        );
        continue;
      case 'unicodeRange':
        hydrateAttribute(
          domElement,
          propKey,
          'unicode-range',
          value,
          extraAttributes,
        );
        continue;
      case 'unitsPerEm':
        hydrateAttribute(
          domElement,
          propKey,
          'units-per-em',
          value,
          extraAttributes,
        );
        continue;
      case 'vAlphabetic':
        hydrateAttribute(
          domElement,
          propKey,
          'v-alphabetic',
          value,
          extraAttributes,
        );
        continue;
      case 'vHanging':
        hydrateAttribute(
          domElement,
          propKey,
          'v-hanging',
          value,
          extraAttributes,
        );
        continue;
      case 'vIdeographic':
        hydrateAttribute(
          domElement,
          propKey,
          'v-ideographic',
          value,
          extraAttributes,
        );
        continue;
      case 'vMathematical':
        hydrateAttribute(
          domElement,
          propKey,
          'v-mathematical',
          value,
          extraAttributes,
        );
        continue;
      case 'vectorEffect':
        hydrateAttribute(
          domElement,
          propKey,
          'vector-effect',
          value,
          extraAttributes,
        );
        continue;
      case 'vertAdvY':
        hydrateAttribute(
          domElement,
          propKey,
          'vert-adv-y',
          value,
          extraAttributes,
        );
        continue;
      case 'vertOriginX':
        hydrateAttribute(
          domElement,
          propKey,
          'vert-origin-x',
          value,
          extraAttributes,
        );
        continue;
      case 'vertOriginY':
        hydrateAttribute(
          domElement,
          propKey,
          'vert-origin-y',
          value,
          extraAttributes,
        );
        continue;
      case 'wordSpacing':
        hydrateAttribute(
          domElement,
          propKey,
          'word-spacing',
          value,
          extraAttributes,
        );
        continue;
      case 'writingMode':
        hydrateAttribute(
          domElement,
          propKey,
          'writing-mode',
          value,
          extraAttributes,
        );
        continue;
      case 'xmlnsXlink':
        hydrateAttribute(
          domElement,
          propKey,
          'xmlns:xlink',
          value,
          extraAttributes,
        );
        continue;
      case 'xHeight':
        hydrateAttribute(
          domElement,
          propKey,
          'x-height',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkActuate':
        hydrateAttribute(
          domElement,
          propKey,
          'xlink:actuate',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkArcrole':
        hydrateAttribute(
          domElement,
          propKey,
          'xlink:arcrole',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkRole':
        hydrateAttribute(
          domElement,
          propKey,
          'xlink:role',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkShow':
        hydrateAttribute(
          domElement,
          propKey,
          'xlink:show',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkTitle':
        hydrateAttribute(
          domElement,
          propKey,
          'xlink:title',
          value,
          extraAttributes,
        );
        continue;
      case 'xlinkType':
        hydrateAttribute(
          domElement,
          propKey,
          'xlink:type',
          value,
          extraAttributes,
        );
        continue;
      case 'xmlBase':
        hydrateAttribute(
          domElement,
          propKey,
          'xml:base',
          value,
          extraAttributes,
        );
        continue;
      case 'xmlLang':
        hydrateAttribute(
          domElement,
          propKey,
          'xml:lang',
          value,
          extraAttributes,
        );
        continue;
      case 'xmlSpace':
        hydrateAttribute(
          domElement,
          propKey,
          'xml:space',
          value,
          extraAttributes,
        );
        continue;
      default: {
        if (
          // shouldIgnoreAttribute
          // We have already filtered out null/undefined and reserved words.
          propKey.length > 2 &&
          (propKey[0] === 'o' || propKey[0] === 'O') &&
          (propKey[1] === 'n' || propKey[1] === 'N')
        ) {
          continue;
        }
        let isMismatchDueToBadCasing = false;
        let ownNamespaceDev = parentNamespaceDev;
        if (ownNamespaceDev === HTML_NAMESPACE) {
          ownNamespaceDev = getIntrinsicNamespace(tag);
        }
        if (ownNamespaceDev === HTML_NAMESPACE) {
          extraAttributes.delete(propKey.toLowerCase());
        } else {
          const standardName = getPossibleStandardName(propKey);
          if (standardName !== null && standardName !== propKey) {
            // If an SVG prop is supplied with bad casing, it will
            // be successfully parsed from HTML, but will produce a mismatch
            // (and would be incorrectly rendered on the client).
            // However, we already warn about bad casing elsewhere.
            // So we'll skip the misleading extra mismatch warning in this case.
            isMismatchDueToBadCasing = true;
            extraAttributes.delete(standardName);
          }
          extraAttributes.delete(propKey);
        }
        const serverValue = getValueForAttribute(domElement, propKey, value);
        if (!isMismatchDueToBadCasing) {
          warnForPropDifference(propKey, serverValue, value);
        }
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
    const extraAttributes: Set<string> = new Set();
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
          extraAttributes.add(attributes[i].name);
      }
    }
    if (isCustomElement(tag, props)) {
      diffHydratedCustomComponent(
        domElement,
        tag,
        props,
        parentNamespaceDev,
        extraAttributes,
      );
    } else {
      diffHydratedGenericElement(
        domElement,
        tag,
        props,
        parentNamespaceDev,
        extraAttributes,
      );
    }
    if (extraAttributes.size > 0 && props.suppressHydrationWarning !== true) {
      warnForExtraAttributes(extraAttributes);
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
