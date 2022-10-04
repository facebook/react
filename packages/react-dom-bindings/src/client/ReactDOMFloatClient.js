/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Instance} from './ReactDOMHostConfig';
import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals.js';
const {Dispatcher} = ReactDOMSharedInternals;
import {
  validateUnmatchedLinkResourceProps,
  validatePreloadResourceDifference,
  validateHrefKeyedUpdatedProps,
  validateStyleResourceDifference,
  validateLinkPropsForStyleResource,
  validateLinkPropsForPreloadResource,
  validatePreloadArguments,
  validatePreinitArguments,
} from '../shared/ReactDOMResourceValidation';
import {createElement, setInitialProperties} from './ReactDOMComponent';
import {HTML_NAMESPACE} from '../shared/DOMNamespaces';

// The resource types we support. currently they match the form for the as argument.
// In the future this may need to change, especially when modules / scripts are supported
type ResourceType = 'style' | 'font';

type PreloadProps = {
  rel: 'preload',
  as: ResourceType,
  href: string,
  [string]: mixed,
};
type PreloadResource = {
  type: 'preload',
  href: string,
  ownerDocument: Document,
  props: PreloadProps,
  instance: Element,
};

type StyleProps = {
  rel: 'stylesheet',
  href: string,
  'data-rprec': string,
  [string]: mixed,
};
type StyleResource = {
  type: 'style',

  // Ref count for resource
  count: number,

  // Resource Descriptors
  href: string,
  precedence: string,
  props: StyleProps,

  // Related Resources
  hint: ?PreloadResource,

  // Insertion
  preloaded: boolean,
  loaded: boolean,
  error: mixed,
  instance: ?Element,
  ownerDocument: Document,
};

type Props = {[string]: mixed};

type Resource = StyleResource | PreloadResource;

// Brief on purpose due to insertion by script when streaming late boundaries
// s = Status
// l = loaded
// e = errored
type StyleResourceLoadingState = Promise<mixed> & {s?: 'l' | 'e'};

// When rendering we set the currentDocument if one exists. we use this for Resources
// we encounter during render. If this is null and we are dispatching preloads and
// other calls on the ReactDOM module we look for the window global and get the document from there
let currentDocument: ?Document = null;

// It is valid to preload even when we aren't actively rendering. For cases where Float functions are
// called when there is no rendering we track the last used document. It is not safe to insert
// arbitrary resources into the lastCurrentDocument b/c it may not actually be the document
// that the resource is meant to apply too (for example stylesheets or scripts). This is only
// appropriate for resources that don't really have a strict tie to the document itself for example
// preloads
let lastCurrentDocument: ?Document = null;

let previousDispatcher = null;
export function prepareToRenderResources(ownerDocument: Document) {
  currentDocument = lastCurrentDocument = ownerDocument;
  previousDispatcher = Dispatcher.current;
  Dispatcher.current = ReactDOMClientDispatcher;
}

export function cleanupAfterRenderResources() {
  currentDocument = null;
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
}

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> FloatClient -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher = {preload, preinit};

// global maps of Resources
const preloadResources: Map<string, PreloadResource> = new Map();
const styleResources: Map<string, StyleResource> = new Map();

// Preloads are somewhat special. Even if we don't have the Document
// used by the root that is rendering a component trying to insert a preload
// we can still seed the file cache by doing the preload on any document we have
// access to. We prefer the currentDocument if it exists, we also prefer the
// lastCurrentDocument if that exists. As a fallback we will use the window.document
// if available.
function getDocumentForPreloads(): ?Document {
  try {
    return currentDocument || lastCurrentDocument || window.document;
  } catch (error) {
    return null;
  }
}

// --------------------------------------
//      ReactDOM.Preload
// --------------------------------------
type PreloadAs = ResourceType;
type PreloadOptions = {as: PreloadAs, crossOrigin?: string};
function preload(href: string, options: PreloadOptions) {
  if (__DEV__) {
    validatePreloadArguments(href, options);
  }
  const ownerDocument = getDocumentForPreloads();
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null &&
    ownerDocument
  ) {
    const as = options.as;
    const resource = preloadResources.get(href);
    if (resource) {
      if (__DEV__) {
        const originallyImplicit =
          (resource: any)._dev_implicit_construction === true;
        const latestProps = preloadPropsFromPreloadOptions(href, as, options);
        validatePreloadResourceDifference(
          resource.props,
          originallyImplicit,
          latestProps,
          false,
        );
      }
    } else {
      const resourceProps = preloadPropsFromPreloadOptions(href, as, options);
      createPreloadResource(ownerDocument, href, resourceProps);
    }
  }
}

function preloadPropsFromPreloadOptions(
  href: string,
  as: ResourceType,
  options: PreloadOptions,
): PreloadProps {
  return {
    href,
    rel: 'preload',
    as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
  };
}

// --------------------------------------
//      ReactDOM.preinit
// --------------------------------------

type PreinitAs = 'style';
type PreinitOptions = {
  as: PreinitAs,
  crossOrigin?: string,
  precedence?: string,
};
function preinit(href: string, options: PreinitOptions) {
  if (__DEV__) {
    validatePreinitArguments(href, options);
  }

  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null
  ) {
    const as = options.as;
    if (!currentDocument) {
      // We are going to emit a preload as a best effort fallback since this preinit
      // was called outside of a render. Given the passive nature of this fallback
      // we do not warn in dev when props disagree if there happens to already be a
      // matching preload with this href
      const preloadDocument = getDocumentForPreloads();
      if (preloadDocument) {
        const preloadResource = preloadResources.get(href);
        if (!preloadResource) {
          const preloadProps = preloadPropsFromPreinitOptions(
            href,
            as,
            options,
          );
          createPreloadResource(preloadDocument, href, preloadProps);
        }
      }
      return;
    }

    switch (as) {
      case 'style': {
        const precedence = options.precedence || 'default';
        let resource = styleResources.get(href);
        if (resource) {
          if (__DEV__) {
            const latestProps = stylePropsFromPreinitOptions(
              href,
              precedence,
              options,
            );
            validateStyleResourceDifference(resource.props, latestProps);
          }
        } else {
          const resourceProps = stylePropsFromPreinitOptions(
            href,
            precedence,
            options,
          );
          resource = createStyleResource(
            // $FlowFixMe[incompatible-call] found when upgrading Flow
            currentDocument,
            href,
            precedence,
            resourceProps,
          );
        }
        acquireResource(resource);
      }
    }
  }
}

function preloadPropsFromPreinitOptions(
  href: string,
  as: ResourceType,
  options: PreinitOptions,
): PreloadProps {
  return {
    href,
    rel: 'preload',
    as,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
  };
}

function stylePropsFromPreinitOptions(
  href: string,
  precedence: string,
  options: PreinitOptions,
): StyleProps {
  return {
    rel: 'stylesheet',
    href,
    'data-rprec': precedence,
    crossOrigin: options.crossOrigin,
  };
}

// --------------------------------------
//      Resources from render
// --------------------------------------

type StyleQualifyingProps = {
  rel: 'stylesheet',
  href: string,
  precedence: string,
  [string]: mixed,
};
type PreloadQualifyingProps = {
  rel: 'preload',
  href: string,
  as: ResourceType,
  [string]: mixed,
};

// This function is called in begin work and we should always have a currentDocument set
export function getResource(
  type: string,
  pendingProps: Props,
  currentProps: null | Props,
): null | Resource {
  if (!currentDocument) {
    throw new Error(
      '"currentDocument" was expected to exist. This is a bug in React.',
    );
  }
  switch (type) {
    case 'link': {
      const {rel} = pendingProps;
      switch (rel) {
        case 'stylesheet': {
          let didWarn;
          if (__DEV__) {
            if (currentProps) {
              didWarn = validateHrefKeyedUpdatedProps(
                pendingProps,
                currentProps,
              );
            }
            if (!didWarn) {
              didWarn = validateLinkPropsForStyleResource(pendingProps);
            }
          }
          const {precedence, href} = pendingProps;
          if (typeof href === 'string' && typeof precedence === 'string') {
            // We've asserted all the specific types for StyleQualifyingProps
            const styleRawProps: StyleQualifyingProps = (pendingProps: any);

            // We construct or get an existing resource for the style itself and return it
            let resource = styleResources.get(href);
            if (resource) {
              if (__DEV__) {
                if (!didWarn) {
                  const latestProps = stylePropsFromRawProps(styleRawProps);
                  if ((resource: any)._dev_preload_props) {
                    adoptPreloadProps(
                      latestProps,
                      (resource: any)._dev_preload_props,
                    );
                  }
                  validateStyleResourceDifference(resource.props, latestProps);
                }
              }
            } else {
              const resourceProps = stylePropsFromRawProps(styleRawProps);
              resource = createStyleResource(
                // $FlowFixMe[incompatible-call] found when upgrading Flow
                currentDocument,
                href,
                precedence,
                resourceProps,
              );
              immediatelyPreloadStyleResource(resource);
            }
            return resource;
          }
          return null;
        }
        case 'preload': {
          if (__DEV__) {
            validateLinkPropsForPreloadResource(pendingProps);
          }
          const {href, as} = pendingProps;
          if (typeof href === 'string' && isResourceAsType(as)) {
            // We've asserted all the specific types for PreloadQualifyingProps
            const preloadRawProps: PreloadQualifyingProps = (pendingProps: any);
            let resource = preloadResources.get(href);
            if (resource) {
              if (__DEV__) {
                const originallyImplicit =
                  (resource: any)._dev_implicit_construction === true;
                const latestProps = preloadPropsFromRawProps(preloadRawProps);
                validatePreloadResourceDifference(
                  resource.props,
                  originallyImplicit,
                  latestProps,
                  false,
                );
              }
            } else {
              const resourceProps = preloadPropsFromRawProps(preloadRawProps);
              resource = createPreloadResource(
                // $FlowFixMe[incompatible-call] found when upgrading Flow
                currentDocument,
                href,
                resourceProps,
              );
            }
            return resource;
          }
          return null;
        }
        default: {
          if (__DEV__) {
            validateUnmatchedLinkResourceProps(pendingProps, currentProps);
          }
          return null;
        }
      }
    }
    default: {
      throw new Error(
        `getResource encountered a resource type it did not expect: "${type}". this is a bug in React.`,
      );
    }
  }
}

function preloadPropsFromRawProps(
  rawBorrowedProps: PreloadQualifyingProps,
): PreloadProps {
  return Object.assign({}, rawBorrowedProps);
}

function stylePropsFromRawProps(rawProps: StyleQualifyingProps): StyleProps {
  const props: StyleProps = Object.assign({}, rawProps);
  props['data-rprec'] = rawProps.precedence;
  props.precedence = null;

  return props;
}

// --------------------------------------
//      Resource Reconciliation
// --------------------------------------

export function acquireResource(resource: Resource): Instance {
  switch (resource.type) {
    case 'style': {
      return acquireStyleResource(resource);
    }
    case 'preload': {
      return resource.instance;
    }
    default: {
      throw new Error(
        `acquireResource encountered a resource type it did not expect: "${resource.type}". this is a bug in React.`,
      );
    }
  }
}

export function releaseResource(resource: Resource) {
  switch (resource.type) {
    case 'style': {
      resource.count--;
    }
  }
}

function createResourceInstance(
  type: string,
  props: Object,
  ownerDocument: Document,
): Instance {
  const element = createElement(type, props, ownerDocument, HTML_NAMESPACE);
  setInitialProperties(element, type, props);
  return element;
}

function createStyleResource(
  ownerDocument: Document,
  href: string,
  precedence: string,
  props: StyleProps,
): StyleResource {
  if (__DEV__) {
    if (styleResources.has(href)) {
      console.error(
        'createStyleResource was called when a style Resource matching the same href already exists. This is a bug in React.',
      );
    }
  }

  const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
    href,
  );
  const existingEl = ownerDocument.querySelector(
    `link[rel="stylesheet"][href="${limitedEscapedHref}"]`,
  );
  const resource = {
    type: 'style',
    count: 0,
    href,
    precedence,
    props,
    hint: null,
    preloaded: false,
    loaded: false,
    error: false,
    ownerDocument,
    instance: null,
  };
  styleResources.set(href, resource);

  if (existingEl) {
    // If we have an existing element in the DOM we don't need to preload this resource nor can we
    // adopt props from any preload that might exist already for this resource. We do need to try
    // to reify the Resource loading state the best we can.
    const loadingState: ?StyleResourceLoadingState = (existingEl: any)._p;
    if (loadingState) {
      switch (loadingState.s) {
        case 'l': {
          resource.loaded = true;
          break;
        }
        case 'e': {
          resource.error = true;
          break;
        }
        default: {
          attachLoadListeners(existingEl, resource);
        }
      }
    } else {
      // This is unfortunately just an assumption. The rationale here is that stylesheets without
      // a loading state must have been flushed in the shell and would have blocked until loading
      // or error. we can't know afterwards which happened for all types of stylesheets (cross origin)
      // for instance) and the techniques for determining if a sheet has loaded that we do have still
      // fail if the sheet loaded zero rules. At the moment we are going to just opt to assume the
      // sheet is loaded if it was flushed in the shell
      resource.loaded = true;
    }
  } else {
    const hint = preloadResources.get(href);
    if (hint) {
      resource.hint = hint;
      // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
      const preloadProps = hint.props;
      adoptPreloadProps(resource.props, hint.props);
      if (__DEV__) {
        (resource: any)._dev_preload_props = preloadProps;
      }
    }
  }

  return resource;
}

function adoptPreloadProps(
  styleProps: StyleProps,
  preloadProps: PreloadProps,
): void {
  if (styleProps.crossOrigin == null)
    styleProps.crossOrigin = preloadProps.crossOrigin;
  if (styleProps.referrerPolicy == null)
    styleProps.referrerPolicy = preloadProps.referrerPolicy;
  if (styleProps.media == null) styleProps.media = preloadProps.media;
  if (styleProps.title == null) styleProps.title = preloadProps.title;
}

function immediatelyPreloadStyleResource(resource: StyleResource) {
  // This function must be called synchronously after creating a styleResource otherwise it may
  // violate assumptions around the existence of a preload. The reason it is extracted out is we
  // don't always want to preload a style, in particular when we are going to synchronously insert
  // that style. We confirm the style resource has no preload already and then construct it. If
  // we wait and call this later it is possible a preload will already exist for this href
  if (resource.loaded === false && resource.hint === null) {
    const {href, props} = resource;
    const preloadProps = preloadPropsFromStyleProps(props);
    resource.hint = createPreloadResource(
      resource.ownerDocument,
      href,
      preloadProps,
    );
  }
}

function preloadPropsFromStyleProps(props: StyleProps): PreloadProps {
  return {
    rel: 'preload',
    as: 'style',
    href: props.href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
  };
}

function createPreloadResource(
  ownerDocument: Document,
  href: string,
  props: PreloadProps,
): PreloadResource {
  const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
    href,
  );
  let element = ownerDocument.querySelector(
    `link[rel="preload"][href="${limitedEscapedHref}"]`,
  );
  if (!element) {
    element = createResourceInstance('link', props, ownerDocument);
    insertPreloadInstance(element, ownerDocument);
  }
  return {
    type: 'preload',
    href: href,
    ownerDocument,
    props,
    instance: element,
  };
}

function acquireStyleResource(resource: StyleResource): Instance {
  if (!resource.instance) {
    const {props, ownerDocument, precedence} = resource;
    const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
      props.href,
    );
    const existingEl = ownerDocument.querySelector(
      `link[rel="stylesheet"][data-rprec][href="${limitedEscapedHref}"]`,
    );
    if (existingEl) {
      resource.instance = existingEl;
      resource.preloaded = true;
      const loadingState: ?StyleResourceLoadingState = (existingEl: any)._p;
      if (loadingState) {
        // if an existingEl is found there should always be a loadingState because if
        // the resource was flushed in the head it should have already been found when
        // the resource was first created. Still defensively we gate this
        switch (loadingState.s) {
          case 'l': {
            resource.loaded = true;
            resource.error = false;
            break;
          }
          case 'e': {
            resource.error = true;
            break;
          }
          default: {
            attachLoadListeners(existingEl, resource);
          }
        }
      } else {
        resource.loaded = true;
      }
    } else {
      const instance = createResourceInstance(
        'link',
        resource.props,
        ownerDocument,
      );

      attachLoadListeners(instance, resource);
      insertStyleInstance(instance, precedence, ownerDocument);
      resource.instance = instance;
    }
  }
  resource.count++;
  return resource.instance;
}

function attachLoadListeners(instance: Instance, resource: StyleResource) {
  const listeners = {};
  listeners.load = onResourceLoad.bind(
    null,
    instance,
    resource,
    listeners,
    loadAndErrorEventListenerOptions,
  );
  listeners.error = onResourceError.bind(
    null,
    instance,
    resource,
    listeners,
    loadAndErrorEventListenerOptions,
  );

  instance.addEventListener(
    'load',
    listeners.load,
    loadAndErrorEventListenerOptions,
  );
  instance.addEventListener(
    'error',
    listeners.error,
    loadAndErrorEventListenerOptions,
  );
}

const loadAndErrorEventListenerOptions = {
  passive: true,
};

function onResourceLoad(
  instance: Instance,
  resource: StyleResource,
  listeners: {[string]: () => mixed},
  listenerOptions: typeof loadAndErrorEventListenerOptions,
) {
  resource.loaded = true;
  resource.error = false;
  for (const event in listeners) {
    instance.removeEventListener(event, listeners[event], listenerOptions);
  }
}

function onResourceError(
  instance: Instance,
  resource: StyleResource,
  listeners: {[string]: () => mixed},
  listenerOptions: typeof loadAndErrorEventListenerOptions,
) {
  resource.loaded = false;
  resource.error = true;
  for (const event in listeners) {
    instance.removeEventListener(event, listeners[event], listenerOptions);
  }
}

function insertStyleInstance(
  instance: Instance,
  precedence: string,
  ownerDocument: Document,
): void {
  const nodes = ownerDocument.querySelectorAll(
    'link[rel="stylesheet"][data-rprec]',
  );
  const last = nodes.length ? nodes[nodes.length - 1] : null;
  let prior = last;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePrecedence = node.dataset.rprec;
    if (nodePrecedence === precedence) {
      prior = node;
    } else if (prior !== last) {
      break;
    }
  }
  if (prior) {
    // We get the prior from the document so we know it is in the tree.
    // We also know that links can't be the topmost Node so the parentNode
    // must exist.
    ((prior.parentNode: any): Node).insertBefore(instance, prior.nextSibling);
  } else {
    // @TODO call getRootNode on root.container. if it is a Document, insert into head
    // if it is a ShadowRoot insert it into the root node.
    const parent = ownerDocument.head;
    if (parent) {
      parent.insertBefore(instance, parent.firstChild);
    } else {
      throw new Error(
        'While attempting to insert a Resource, React expected the Document to contain' +
          ' a head element but it was not found.',
      );
    }
  }
}

function insertPreloadInstance(
  instance: Instance,
  ownerDocument: Document,
): void {
  if (!ownerDocument.contains(instance)) {
    const parent = ownerDocument.head;
    if (parent) {
      parent.appendChild(instance);
    } else {
      throw new Error(
        'While attempting to insert a Resource, React expected the Document to contain' +
          ' a head element but it was not found.',
      );
    }
  }
}

export function isHostResourceType(type: string, props: Props): boolean {
  switch (type) {
    case 'link': {
      switch (props.rel) {
        case 'stylesheet': {
          if (__DEV__) {
            validateLinkPropsForStyleResource(props);
          }
          const {href, precedence, onLoad, onError, disabled} = props;
          return (
            typeof href === 'string' &&
            typeof precedence === 'string' &&
            !onLoad &&
            !onError &&
            disabled == null
          );
        }
        case 'preload': {
          if (__DEV__) {
            validateLinkPropsForStyleResource(props);
          }
          const {href, as, onLoad, onError} = props;
          return (
            !onLoad &&
            !onError &&
            typeof href === 'string' &&
            isResourceAsType(as)
          );
        }
      }
    }
  }
  return false;
}

function isResourceAsType(as: mixed): boolean {
  return as === 'style' || as === 'font';
}

// When passing user input into querySelector(All) the embedded string must not alter
// the semantics of the query. This escape function is safe to use when we know the
// provided value is going to be wrapped in double quotes as part of an attribute selector
// Do not use it anywhere else
// we escape double quotes and backslashes
const escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n\"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value: string): string {
  return value.replace(
    escapeSelectorAttributeValueInsideDoubleQuotesRegex,
    ch => '\\' + ch.charCodeAt(0).toString(16),
  );
}
