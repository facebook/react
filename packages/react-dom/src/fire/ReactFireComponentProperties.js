/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getNamespace, isPropAnEvent, setInnerHTML} from './ReactFireUtils';
import {
  AUTOFOCUS,
  CHILDREN,
  DANGEROUSLY_SET_INNER_HTML,
  HTML,
  STYLE,
  HTML_NAMESPACE,
  SUPPRESS_CONTENT_EDITABLE_WARNING,
  SUPPRESS_HYDRATION_WARNING,
} from './ReactFireDOMConfig';
import {
  createDangerousStringForStyles,
  possibleStandardNames,
} from './ReactFireDevOnly';
import {ensureListeningTo, setEventProp} from './ReactFireEvents';
import {setValueForStyles} from './ReactFireStyling';
import {assertValidProps} from './ReactFireValidation';
import {
  getPropertyInfo,
  shouldIgnoreAttribute,
  shouldRemoveAttribute,
  isAttributeNameSafe,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
} from '../shared/DOMProperty';
import type {PropertyInfo} from '../../shared/DOMProperty';

import warning from 'shared/warning';
import warningWithoutStack from 'shared/warningWithoutStack';
import {canUseDOM} from 'shared/ExecutionEnvironment';

let warnForInvalidEventListener;
let warnForPropDifference;
let didWarnInvalidHydration = false;
let normalizeMarkupForTextOrAttribute;
let warnForTextDifference;
let suppressHydrationWarning;
let canDiffStyleForHydrationWarning;
let warnForExtraAttributes;
let normalizeHTML;

if (__DEV__) {
  // IE 11 parses & normalizes the style attribute as opposed to other
  // browsers. It adds spaces and sorts the properties in some
  // non-alphabetical order. Handling that would require sorting CSS
  // properties in the client & server versions or applying
  // `expectedStyle` to a temporary DOM node to read its `style` attribute
  // normalized. Since it only affects IE, we're skipping style warnings
  // in that browser completely in favor of doing all that work.
  // See https://github.com/facebook/react/issues/11807
  canDiffStyleForHydrationWarning = canUseDOM && !document.documentMode;
  // HTML parsing normalizes CR and CRLF to LF.
  // It also can turn \u0000 into \uFFFD inside attributes.
  // https://www.w3.org/TR/html5/single-page.html#preprocessing-the-input-stream
  // If we have a mismatch, it might be caused by that.
  // We will still patch up in this case but not fire the warning.
  const NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
  const NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;

  // Parse the HTML and read it back to normalize the HTML string so that it
  // can be used for comparison.
  normalizeHTML = function(parent: Element, html: string) {
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
  };

  normalizeMarkupForTextOrAttribute = function(markup: mixed): string {
    const markupString =
      typeof markup === 'string' ? markup : '' + (markup: any);
    return markupString
      .replace(NORMALIZE_NEWLINES_REGEX, '\n')
      .replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, '');
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
  warnForTextDifference = function(
    serverText: string,
    clientText: string | number,
  ) {
    if (didWarnInvalidHydration) {
      return;
    }
    const normalizedClientText = normalizeMarkupForTextOrAttribute(clientText);
    const normalizedServerText = normalizeMarkupForTextOrAttribute(serverText);
    if (normalizedServerText === normalizedClientText) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Text content did not match. Server: "%s" Client: "%s"',
      normalizedServerText,
      normalizedClientText,
    );
  };
  warnForPropDifference = function(
    propName: string,
    serverValue: mixed,
    clientValue: mixed,
  ) {
    if (didWarnInvalidHydration) {
      return;
    }
    const normalizedClientValue = normalizeMarkupForTextOrAttribute(
      clientValue,
    );
    const normalizedServerValue = normalizeMarkupForTextOrAttribute(
      serverValue,
    );
    if (normalizedServerValue === normalizedClientValue) {
      return;
    }
    didWarnInvalidHydration = true;
    warningWithoutStack(
      false,
      'Prop `%s` did not match. Server: %s Client: %s',
      propName,
      JSON.stringify(normalizedServerValue),
      JSON.stringify(normalizedClientValue),
    );
  };
  warnForExtraAttributes = function(attributeNames: Set<string>) {
    if (didWarnInvalidHydration) {
      return;
    }
    didWarnInvalidHydration = true;
    const names = [];
    attributeNames.forEach(function(name) {
      names.push(name);
    });
    warningWithoutStack(false, 'Extra attributes from the server: %s', names);
  };
}

export function setDOMElementProperties(
  type: string,
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
  isCustomComponentTag: boolean,
) {
  assertValidProps(type, props);
  for (let propName in props) {
    if (!props.hasOwnProperty(propName)) {
      continue;
    }
    const propValue = props[propName];

    if (propName === CHILDREN) {
      if (typeof propValue === 'string') {
        // Avoid setting initial textContent when the text is empty. In IE11 setting
        // textContent on a <textarea> will cause the placeholder to not
        // show within the <textarea> until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        if (type === 'textarea' && propValue === '') {
          continue;
        }
      } else if (typeof propValue !== 'number') {
        continue;
      }
      // No need to cast to string if propValue is a number, textContent supports
      // being set with a number value and will cast it for us.
      domNode.textContent = propValue;
    } else if (
      propName === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propName === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } else if (propName === AUTOFOCUS) {
      // We polyfill it separately on the client during commit.
      // We could have excluded it in the property list instead of
      // adding a special case here, but then it wouldn't be emitted
      // on server rendering (but we *do* want to emit it in SSR).
    } else if (propName === STYLE) {
      if (__DEV__) {
        if (propValue) {
          // Freeze the next style object so that we can assume it won't be
          // mutated. We have already warned for this in the past.
          Object.freeze(propValue);
        }
      }
      setValueForStyles(domNode, propValue);
    } else if (propName === DANGEROUSLY_SET_INNER_HTML) {
      const htmlValue = propValue ? propValue[HTML] : undefined;
      if (htmlValue != null) {
        setInnerHTML(domNode, htmlValue);
      }
    } else if (isPropAnEvent(propName) && !isCustomComponentTag) {
      if (__DEV__ && typeof propValue !== 'function') {
        warnForInvalidEventListener(propName, propValue);
      }
      ensureListeningTo(rootContainerElement, propName);
      setEventProp(propName, propValue, domNode);
    } else {
      setValueForProperty(domNode, propName, propValue, isCustomComponentTag);
    }
  }
}

export function updateDOMElementProperties(
  domNode: Element,
  lastRawProps: Object,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean,
) {
  // TODO: Handle wasCustomComponentTag
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propName = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propName === STYLE) {
      setValueForStyles(domNode, propValue);
    } else if (propName === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domNode, propValue);
    } else if (propName === CHILDREN) {
      const lastChildren = lastRawProps.children;
      if (
        typeof lastChildren !== 'string' ||
        domNode.firstChild === null ||
        propValue === ''
      ) {
        domNode.textContent = propValue;
      } else {
        domNode.firstChild.nodeValue = propValue;
      }
    } else if (isPropAnEvent(propName) && !isCustomComponentTag) {
      setEventProp(propName, propValue, domNode);
    } else {
      setValueForProperty(domNode, propName, propValue, isCustomComponentTag);
    }
  }
}

export function diffHydratedDOMElementProperties(
  type: string,
  props: Object,
  domNode: Element,
  rootContainerElement: Element | Document,
  isCustomComponentTag: boolean,
  parentNamespace: string,
) {
  let extraAttributeNames: Set<string>;
  if (__DEV__) {
    suppressHydrationWarning = props[SUPPRESS_HYDRATION_WARNING] === true;
    extraAttributeNames = new Set();
    const attributes = domNode.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const name = attributes[i].name.toLowerCase();
      switch (name) {
        // Built-in SSR attribute is whitelisted
        case 'data-reactroot':
          break;
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
  }

  let updatePayload = null;
  for (const propName in props) {
    if (!props.hasOwnProperty(propName)) {
      continue;
    }
    const propValue = props[propName];
    if (propName === CHILDREN) {
      // For text content children we compare against textContent. This
      // might match additional HTML that is hidden when we read it using
      // textContent. E.g. "foo" will match "f<span>oo</span>" but that still
      // satisfies our requirement. Our requirement is not to produce perfect
      // HTML and attributes. Ideally we should preserve structure but it's
      // ok not to if the visible content is still enough to indicate what
      // even listeners these nodes might be wired up to.
      // TODO: Warn if there is more than a single textNode as a child.
      // TODO: Should we use domElement.firstChild.nodeValue to compare?
      if (typeof propValue === 'string') {
        if (domNode.textContent !== propValue) {
          if (__DEV__ && !suppressHydrationWarning) {
            warnForTextDifference(domNode.textContent, propValue);
          }
          updatePayload = [CHILDREN, propValue];
        }
      } else if (typeof propValue === 'number') {
        if (domNode.textContent !== '' + propValue) {
          if (__DEV__ && !suppressHydrationWarning) {
            warnForTextDifference(domNode.textContent, propValue);
          }
          updatePayload = [CHILDREN, '' + propValue];
        }
      }
    } else if (isPropAnEvent(propName) && !isCustomComponentTag) {
      if (propValue != null) {
        if (__DEV__ && typeof propValue !== 'function') {
          warnForInvalidEventListener(propName, propValue);
        }
        ensureListeningTo(rootContainerElement, propName);
        setEventProp(propName, propValue, domNode);
      }
    } else if (
      __DEV__ &&
      // Convince Flow we've calculated it (it's DEV-only in this method.)
      typeof isCustomComponentTag === 'boolean'
    ) {
      // Validate that the properties correspond to their expected values.
      let serverValue;
      const propertyInfo = getPropertyInfo(propName);
      if (suppressHydrationWarning) {
        // Don't bother comparing. We're ignoring all these warnings.
      } else if (
        propName === SUPPRESS_CONTENT_EDITABLE_WARNING ||
        propName === SUPPRESS_HYDRATION_WARNING ||
        // Controlled attributes are not validated
        // TODO: Only ignore them on controlled tags.
        propName === 'value' ||
        propName === 'checked' ||
        propName === 'selected'
      ) {
        // Noop
      } else if (propName === DANGEROUSLY_SET_INNER_HTML) {
        const serverHTML = domNode.innerHTML;
        const nextHtml = propValue ? propValue[HTML] : undefined;
        const expectedHTML = normalizeHTML(
          domNode,
          nextHtml != null ? nextHtml : '',
        );
        if (expectedHTML !== serverHTML) {
          warnForPropDifference(propName, serverHTML, expectedHTML);
        }
      } else if (propName === STYLE) {
        // $FlowFixMe - Should be inferred as not undefined.
        extraAttributeNames.delete(propName);

        if (canDiffStyleForHydrationWarning) {
          const expectedStyle = createDangerousStringForStyles(propValue);
          serverValue = domNode.getAttribute('style');
          if (expectedStyle !== serverValue) {
            warnForPropDifference(propName, serverValue, expectedStyle);
          }
        }
      } else if (isCustomComponentTag) {
        // $FlowFixMe - Should be inferred as not undefined.
        extraAttributeNames.delete(propName.toLowerCase());
        serverValue = getValueForAttribute(domNode, propName, propValue);

        if (propValue !== serverValue) {
          warnForPropDifference(propName, serverValue, propValue);
        }
      } else if (
        !shouldIgnoreAttribute(propName, propertyInfo, isCustomComponentTag) &&
        !shouldRemoveAttribute(
          propName,
          propValue,
          propertyInfo,
          isCustomComponentTag,
        )
      ) {
        let isMismatchDueToBadCasing = false;
        if (propertyInfo !== null) {
          // $FlowFixMe - Should be inferred as not undefined.
          extraAttributeNames.delete(propertyInfo.attributeName);
          serverValue = getValueForProperty(
            domNode,
            propName,
            propValue,
            propertyInfo,
          );
        } else {
          let ownNamespace = parentNamespace;
          if (ownNamespace === HTML_NAMESPACE) {
            ownNamespace = getNamespace(type);
          }
          if (ownNamespace === HTML_NAMESPACE) {
            // $FlowFixMe - Should be inferred as not undefined.
            extraAttributeNames.delete(propName.toLowerCase());
          } else {
            const standardName = getPossibleStandardName(propName);
            if (standardName !== null && standardName !== propName) {
              // If an SVG prop is supplied with bad casing, it will
              // be successfully parsed from HTML, but will produce a mismatch
              // (and would be incorrectly rendered on the client).
              // However, we already warn about bad casing elsewhere.
              // So we'll skip the misleading extra mismatch warning in this case.
              isMismatchDueToBadCasing = true;
              // $FlowFixMe - Should be inferred as not undefined.
              extraAttributeNames.delete(standardName);
            }
            // $FlowFixMe - Should be inferred as not undefined.
            extraAttributeNames.delete(propName);
          }
          serverValue = getValueForAttribute(domNode, propName, propValue);
        }

        if (propValue !== serverValue && !isMismatchDueToBadCasing) {
          warnForPropDifference(propName, serverValue, propValue);
        }
      }
    }
  }

  if (__DEV__) {
    // $FlowFixMe - Should be inferred as not undefined.
    if (extraAttributeNames.size > 0 && !suppressHydrationWarning) {
      // $FlowFixMe - Should be inferred as not undefined.
      warnForExtraAttributes(extraAttributeNames);
    }
  }
  return updatePayload;
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

/**
 * Sets the value for a property on a node.
 */
export function setValueForProperty(
  node: Element,
  name: string,
  value: mixed,
  isCustomComponentTag: boolean,
) {
  const propertyInfo = getPropertyInfo(name);
  if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
    return;
  }
  if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
    value = null;
  }
  // If the prop isn't in the special list, treat it as a simple attribute.
  if (isCustomComponentTag || propertyInfo === null) {
    if (isAttributeNameSafe(name)) {
      const attributeName = name;
      if (value === null) {
        node.removeAttribute(attributeName);
      } else {
        node.setAttribute(attributeName, '' + (value: any));
      }
    }
    return;
  }
  const {mustUseProperty} = propertyInfo;
  if (mustUseProperty) {
    const {propertyName} = propertyInfo;
    if (value === null) {
      const {type} = propertyInfo;
      (node: any)[propertyName] = type === BOOLEAN ? false : '';
    } else {
      // Contrary to `setAttribute`, object properties are properly
      // `toString`ed by IE8/9.
      (node: any)[propertyName] = value;
    }
    return;
  }
  // The rest are treated as attributes with special cases.
  const {attributeName, attributeNamespace} = propertyInfo;
  if (value === null) {
    node.removeAttribute(attributeName);
  } else {
    const {type} = propertyInfo;
    let attributeValue;
    if (type === BOOLEAN || (type === OVERLOADED_BOOLEAN && value === true)) {
      attributeValue = '';
    } else {
      // `setAttribute` with objects becomes only `[object]` in IE8/9,
      // ('' + value) makes it output the correct toString()-value.
      attributeValue = '' + (value: any);
    }
    if (attributeNamespace) {
      node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
    } else {
      node.setAttribute(attributeName, attributeValue);
    }
  }
}

/**
 * Get the value for a property on a node. Only used in DEV for SSR validation.
 * The "expected" argument is used as a hint of what the expected value is.
 * Some properties have multiple equivalent values.
 */
export function getValueForProperty(
  node: Element,
  name: string,
  expected: mixed,
  propertyInfo: PropertyInfo,
): mixed {
  if (__DEV__) {
    if (propertyInfo.mustUseProperty) {
      const {propertyName} = propertyInfo;
      return (node: any)[propertyName];
    } else {
      const attributeName = propertyInfo.attributeName;

      let stringValue = null;

      if (propertyInfo.type === OVERLOADED_BOOLEAN) {
        if (node.hasAttribute(attributeName)) {
          const value = node.getAttribute(attributeName);
          if (value === '') {
            return true;
          }
          if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
            return value;
          }
          if (value === '' + (expected: any)) {
            return expected;
          }
          return value;
        }
      } else if (node.hasAttribute(attributeName)) {
        if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
          // We had an attribute but shouldn't have had one, so read it
          // for the error message.
          return node.getAttribute(attributeName);
        }
        if (propertyInfo.type === BOOLEAN) {
          // If this was a boolean, it doesn't matter what the value is
          // the fact that we have it is the same as the expected.
          return expected;
        }
        // Even if this property uses a namespace we use getAttribute
        // because we assume its namespaced name is the same as our config.
        // To use getAttributeNS we need the local name which we don't have
        // in our config atm.
        stringValue = node.getAttribute(attributeName);
      }

      if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
        return stringValue === null ? expected : stringValue;
      } else if (stringValue === '' + (expected: any)) {
        return expected;
      } else {
        return stringValue;
      }
    }
  }
}

/**
 * Get the value for a attribute on a node. Only used in DEV for SSR validation.
 * The third argument is used as a hint of what the expected value is. Some
 * attributes have multiple equivalent values.
 */
export function getValueForAttribute(
  node: Element,
  name: string,
  expected: mixed,
): mixed {
  if (__DEV__) {
    if (!isAttributeNameSafe(name)) {
      return;
    }
    if (!node.hasAttribute(name)) {
      return expected === undefined ? undefined : null;
    }
    const value = node.getAttribute(name);
    if (value === '' + (expected: any)) {
      return expected;
    }
    return value;
  }
}
