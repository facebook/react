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
  getOwnerDocumentFromRootContainer,
  isCustomComponent,
  isPropAnEvent,
} from '../ReactFireUtils';
import {applyHostComponentInputMountWrapper} from './controlled/ReactFireInput';
import {applyHostComponentOptionMountWrapper} from './controlled/ReactFireOption';
import {applyHostComponentSelectMountWrapper} from './controlled/ReactFireSelect';
import {applyHostComponentTextareaMountWrapper} from './controlled/ReactFireTextarea';
import {trapClickOnNonInteractiveElement} from '../events/ReactFireEvents';
import {track} from './controlled/ReactFireValueTracking';
import type {
  HostContext,
  HostContextDev,
  HostContextProd,
} from '../ReactFireHostConfig';
import {specialHostComponentTypes} from './ReactFireHostComponentSpecialTypes';
import {setValueForStyles} from './ReactFireHostComponentStyling';
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
import {assertValidProps} from '../ReactFireValidation';
import {ensureListeningTo} from '../events/ReactFireEvents';
import {setHostComponentAttribute} from './ReactFireHostComponentAttributes';
import {
  didWarnShadyDOM,
  setDidWarnShadyDOM,
  validatePropertiesInDevelopment,
  warnForInvalidEventListener,
  warnedUnknownTags,
} from '../ReactFireDevOnly';
import {setInnerHTML} from './ReactFireHostComponentInnerHTML';

import warning from 'shared/warning';
import {getCurrentFiberOwnerNameInDevOrNull} from 'react-reconciler/src/ReactCurrentFiber';

function createElement(
  type: string,
  props: Object,
  rootContainerElement: Element | Document,
  parentNamespace: string,
): Element {
  let isCustomComponentTag;

  // We create tags in the namespace of their parent container, except HTML
  // tags get no namespace.
  const ownerDocument: Document = getOwnerDocumentFromRootContainer(
    rootContainerElement,
  );
  let domElement: Element;
  let namespaceURI = parentNamespace;
  if (namespaceURI === HTML_NAMESPACE) {
    namespaceURI = getNamespace(type);
  }
  if (namespaceURI === HTML_NAMESPACE) {
    if (__DEV__) {
      isCustomComponentTag = isCustomComponent(type, props);
      // Should this check be gated by parent namespace? Not sure we want to
      // allow <SVG> or <mATH>.
      warning(
        isCustomComponentTag || type === type.toLowerCase(),
        '<%s /> is using incorrect casing. ' +
          'Use PascalCase for React components, ' +
          'or lowercase for HTML elements.',
        type,
      );
    }

    if (type === 'script') {
      // Create the script via .innerHTML so its "parser-inserted" flag is
      // set to true and it does not execute
      const div = ownerDocument.createElement('div');
      div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
      // This is guaranteed to yield a script element.
      const firstChild = ((div.firstChild: any): HTMLScriptElement);
      domElement = div.removeChild(firstChild);
    } else if (typeof props.is === 'string') {
      // $FlowIssue `createElement` should be updated for Web Components
      domElement = ownerDocument.createElement(type, {is: props.is});
    } else {
      // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
      // See discussion in https://github.com/facebook/react/pull/6896
      // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
      domElement = ownerDocument.createElement(type);
      // Normally attributes are assigned in `setInitialDOMProperties`, however the `multiple`
      // attribute on `select`s needs to be added before `option`s are inserted. This prevents
      // a bug where the `select` does not scroll to the correct option because singular
      // `select` elements automatically pick the first item.
      // See https://github.com/facebook/react/issues/13222
      if (type === 'select' && props.multiple) {
        const node = ((domElement: any): HTMLSelectElement);
        node.multiple = true;
      }
    }
  } else {
    domElement = ownerDocument.createElementNS(namespaceURI, type);
  }

  if (__DEV__) {
    if (namespaceURI === HTML_NAMESPACE) {
      if (
        !isCustomComponentTag &&
        Object.prototype.toString.call(domElement) ===
          '[object HTMLUnknownElement]' &&
        !Object.prototype.hasOwnProperty.call(warnedUnknownTags, type)
      ) {
        warnedUnknownTags[type] = true;
        warning(
          false,
          'The tag <%s> is unrecognized in this browser. ' +
            'If you meant to render a React component, start its name with ' +
            'an uppercase letter.',
          type,
        );
      }
    }
  }

  return domElement;
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
      setDidWarnShadyDOM();
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
      if (propValue != null) {
        if (__DEV__ && typeof propValue !== 'function') {
          warnForInvalidEventListener(propName, propValue);
        }
        ensureListeningTo(rootContainerElement, propName);
      }
    } else {
      setHostComponentAttribute(
        domNode,
        propName,
        propValue,
        isCustomComponentTag,
      );
    }
  }

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
