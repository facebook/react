/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  getNamespace,
  isCustomComponent,
  isPropAnEvent,
} from '../ReactFireUtils';
import {
  AUTOFOCUS,
  CHILDREN,
  DANGEROUSLY_SET_INNER_HTML,
  HTML,
  HTML_NAMESPACE,
  STYLE,
  SUPPRESS_CONTENT_EDITABLE_WARNING,
  SUPPRESS_HYDRATION_WARNING,
} from '../ReactFireDOMConfig';
import {
  assertValidProps,
  validateShorthandPropertyCollisionInDev,
} from '../ReactFireValidation';
import {ensureListeningTo} from '../events/ReactFireEvents';
import {
  canDiffStyleForHydrationWarning,
  createDangerousStringForStyles,
  didWarnShadyDOM,
  getPossibleStandardName,
  getValueForAttribute,
  getValueForProperty,
  normalizeHTML,
  setDidWarnShadyDOM,
  setSuppressHydrationWarning,
  suppressHydrationWarning,
  validatePropertiesInDevelopment,
  warnForExtraAttributes,
  warnForInvalidEventListener,
  warnForPropDifference,
  warnForTextDifference,
} from '../ReactFireDevOnly';
import {track} from './controlled/ReactFireValueTracking';
import {trapClickOnNonInteractiveElement} from '../events/ReactFireEvents';
import {
  applyHostComponentInputMountWrapper,
  getHostComponentInputProps,
} from './controlled/ReactFireInput';
import {getHostComponentOptionProps} from './controlled/ReactFireOption';
import {getHostComponentSelectProps} from './controlled/ReactFireSelect';
import {
  applyHostComponentTextareaMountWrapper,
  getHostComponentTextareaProps,
} from './controlled/ReactFireTextarea';
import {specialHostComponentTypes} from './ReactFireHostComponentSpecialTypes';
import {
  getPropertyInfo,
  shouldIgnoreAttribute,
  shouldRemoveAttribute,
} from '../../shared/DOMProperty';

import warning from 'shared/warning';
import {getCurrentFiberOwnerNameInDevOrNull} from 'react-reconciler/src/ReactCurrentFiber';

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
    } else if (nextProp != null && isPropAnEvent(propName)) {
      if (__DEV__ && typeof nextProp !== 'function') {
        warnForInvalidEventListener(propName, nextProp);
      }
      ensureListeningTo(rootContainerElement, propName);
      if (!updatePayload && lastProp !== nextProp) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" props pointer gets updated so we need a commit
        // to update this element.
        updatePayload = [];
      }
    } else {
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
      setDidWarnShadyDOM();
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

  let extraAttributeNames: Set<string>;
  if (__DEV__) {
    setSuppressHydrationWarning(rawProps[SUPPRESS_HYDRATION_WARNING] === true);
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
  for (const propName in rawProps) {
    if (!rawProps.hasOwnProperty(propName)) {
      continue;
    }
    const propValue = rawProps[propName];
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
