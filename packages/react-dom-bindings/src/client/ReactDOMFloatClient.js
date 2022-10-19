/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Instance, Container} from './ReactDOMHostConfig';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals.js';
const {Dispatcher} = ReactDOMSharedInternals;
import {DOCUMENT_NODE} from '../shared/HTMLNodeType';
import {
  validateUnmatchedLinkResourceProps,
  validatePreloadResourceDifference,
  validateURLKeyedUpdatedProps,
  validateStyleResourceDifference,
  validateScriptResourceDifference,
  validateLinkPropsForStyleResource,
  validateLinkPropsForPreloadResource,
  validatePreloadArguments,
  validatePreinitArguments,
} from '../shared/ReactDOMResourceValidation';
import {createElement, setInitialProperties} from './ReactDOMComponent';
import {
  getResourcesFromRoot,
  markNodeAsResource,
} from './ReactDOMComponentTree';
import {HTML_NAMESPACE} from '../shared/DOMNamespaces';
import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';

// The resource types we support. currently they match the form for the as argument.
// In the future this may need to change, especially when modules / scripts are supported
type ResourceType = 'style' | 'font' | 'script';

type PreloadProps = {
  rel: 'preload',
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
  'data-precedence': string,
  [string]: mixed,
};
export type StyleResource = {
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
  root: FloatRoot,
};
type ScriptProps = {
  src: string,
  [string]: mixed,
};
export type ScriptResource = {
  type: 'script',
  src: string,
  props: ScriptProps,

  instance: ?Element,
  root: FloatRoot,
};

type HeadProps = {
  [string]: mixed,
};
export type HeadResource = {
  type: 'head',
  instanceType: string,
  props: HeadProps,

  count: number,
  instance: ?Element,
  root: Document,
};

type Props = {[string]: mixed};

type Resource = StyleResource | ScriptResource | PreloadResource | HeadResource;

export type RootResources = {
  styles: Map<string, StyleResource>,
  scripts: Map<string, ScriptResource>,
  head: Map<string, HeadResource>,
};

// Brief on purpose due to insertion by script when streaming late boundaries
// s = Status
// l = loaded
// e = errored
type StyleResourceLoadingState = Promise<mixed> & {s?: 'l' | 'e'};

// It is valid to preload even when we aren't actively rendering. For cases where Float functions are
// called when there is no rendering we track the last used document. It is not safe to insert
// arbitrary resources into the lastCurrentDocument b/c it may not actually be the document
// that the resource is meant to apply too (for example stylesheets or scripts). This is only
// appropriate for resources that don't really have a strict tie to the document itself for example
// preloads
let lastCurrentDocument: ?Document = null;

let previousDispatcher = null;
export function prepareToRenderResources(rootContainer: Container) {
  // Flot thinks that getRootNode returns a Node but it actually returns a
  // Document or ShadowRoot
  const rootNode: FloatRoot = (rootContainer.getRootNode(): any);
  lastCurrentDocument = getDocumentFromRoot(rootNode);

  previousDispatcher = Dispatcher.current;
  Dispatcher.current = ReactDOMClientDispatcher;
}

export function cleanupAfterRenderResources() {
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
}

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> FloatClient -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher = {preload, preinit};

export type FloatRoot = Document | ShadowRoot;

// global maps of Resources
const preloadResources: Map<string, PreloadResource> = new Map();

function getCurrentResourceRoot(): null | FloatRoot {
  const currentContainer = getCurrentRootHostContainer();
  // $FlowFixMe flow should know currentContainer is a Node and has getRootNode
  return currentContainer ? currentContainer.getRootNode() : null;
}

// Preloads are somewhat special. Even if we don't have the Document
// used by the root that is rendering a component trying to insert a preload
// we can still seed the file cache by doing the preload on any document we have
// access to. We prefer the currentDocument if it exists, we also prefer the
// lastCurrentDocument if that exists. As a fallback we will use the window.document
// if available.
function getDocumentForPreloads(): ?Document {
  const root = getCurrentResourceRoot();
  if (root) {
    return root.ownerDocument || root;
  } else {
    try {
      return lastCurrentDocument || window.document;
    } catch (error) {
      return null;
    }
  }
}

function getDocumentFromRoot(root: FloatRoot): Document {
  return root.ownerDocument || root;
}

// --------------------------------------
//      ReactDOM.Preload
// --------------------------------------
type PreloadAs = ResourceType;
type PreloadOptions = {as: PreloadAs, crossOrigin?: string, integrity?: string};
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
    integrity: options.integrity,
  };
}

// --------------------------------------
//      ReactDOM.preinit
// --------------------------------------

type PreinitAs = 'style' | 'script';
type PreinitOptions = {
  as: PreinitAs,
  precedence?: string,
  crossOrigin?: string,
  integrity?: string,
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
    const resourceRoot = getCurrentResourceRoot();
    const as = options.as;
    if (!resourceRoot) {
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
        const styleResources = getResourcesFromRoot(resourceRoot).styles;
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
            styleResources,
            resourceRoot,
            href,
            precedence,
            resourceProps,
          );
        }
        acquireResource(resource);
        return;
      }
      case 'script': {
        const src = href;
        const scriptResources = getResourcesFromRoot(resourceRoot).scripts;
        let resource = scriptResources.get(src);
        if (resource) {
          if (__DEV__) {
            const latestProps = scriptPropsFromPreinitOptions(src, options);
            validateScriptResourceDifference(resource.props, latestProps);
          }
        } else {
          const resourceProps = scriptPropsFromPreinitOptions(src, options);
          resource = createScriptResource(
            scriptResources,
            resourceRoot,
            src,
            resourceProps,
          );
        }
        acquireResource(resource);
        return;
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
    integrity: options.integrity,
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
    'data-precedence': precedence,
    crossOrigin: options.crossOrigin,
  };
}

function scriptPropsFromPreinitOptions(
  src: string,
  options: PreinitOptions,
): ScriptProps {
  return {
    src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
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
  [string]: mixed,
};
type ScriptQualifyingProps = {
  src: string,
  async: true,
  [string]: mixed,
};

function getTitleKey(child: string | number): string {
  return 'title:' + child;
}

// This function is called in begin work and we should always have a currentDocument set
export function getResource(
  type: string,
  pendingProps: Props,
  currentProps: null | Props,
): null | Resource {
  const resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) {
    throw new Error(
      '"resourceRoot" was expected to exist. This is a bug in React.',
    );
  }
  switch (type) {
    case 'title': {
      let child = pendingProps.children;
      if (Array.isArray(child) && child.length === 1) {
        child = child[0];
      }
      if (typeof child === 'string' || typeof child === 'number') {
        const headRoot: Document = getDocumentFromRoot(resourceRoot);
        const headResources = getResourcesFromRoot(headRoot).head;
        const key = getTitleKey(child);
        let resource = headResources.get(key);
        if (!resource) {
          const titleProps = titlePropsFromRawProps(child, pendingProps);
          resource = createHeadResource(
            headResources,
            headRoot,
            'title',
            key,
            titleProps,
          );
        }
        return resource;
      }
      return null;
    }
    case 'link': {
      const {rel} = pendingProps;
      switch (rel) {
        case 'stylesheet': {
          const styleResources = getResourcesFromRoot(resourceRoot).styles;
          let didWarn;
          if (__DEV__) {
            if (currentProps) {
              didWarn = validateURLKeyedUpdatedProps(
                pendingProps,
                currentProps,
                'style',
                'href',
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
                    adoptPreloadPropsForStyle(
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
                styleResources,
                resourceRoot,
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
          const {href} = pendingProps;
          if (typeof href === 'string') {
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
                getDocumentFromRoot(resourceRoot),
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
    case 'script': {
      const scriptResources = getResourcesFromRoot(resourceRoot).scripts;
      let didWarn;
      if (__DEV__) {
        if (currentProps) {
          didWarn = validateURLKeyedUpdatedProps(
            pendingProps,
            currentProps,
            'script',
            'src',
          );
        }
      }
      const {src, async} = pendingProps;
      if (async && typeof src === 'string') {
        const scriptRawProps: ScriptQualifyingProps = (pendingProps: any);
        let resource = scriptResources.get(src);
        if (resource) {
          if (__DEV__) {
            if (!didWarn) {
              const latestProps = scriptPropsFromRawProps(scriptRawProps);
              if ((resource: any)._dev_preload_props) {
                adoptPreloadPropsForScript(
                  latestProps,
                  (resource: any)._dev_preload_props,
                );
              }
              validateScriptResourceDifference(resource.props, latestProps);
            }
          }
        } else {
          const resourceProps = scriptPropsFromRawProps(scriptRawProps);
          resource = createScriptResource(
            scriptResources,
            resourceRoot,
            src,
            resourceProps,
          );
        }
        return resource;
      }
      return null;
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

function titlePropsFromRawProps(
  child: string | number,
  rawProps: Props,
): HeadProps {
  const props: HeadProps = Object.assign({}, rawProps);
  props.children = child;
  return props;
}

function stylePropsFromRawProps(rawProps: StyleQualifyingProps): StyleProps {
  const props: StyleProps = Object.assign({}, rawProps);
  props['data-precedence'] = rawProps.precedence;
  props.precedence = null;

  return props;
}

function scriptPropsFromRawProps(rawProps: ScriptQualifyingProps): ScriptProps {
  const props: ScriptProps = Object.assign({}, rawProps);
  return props;
}

// --------------------------------------
//      Resource Reconciliation
// --------------------------------------

export function acquireResource(resource: Resource): Instance {
  switch (resource.type) {
    case 'head': {
      return acquireHeadResource(resource);
    }
    case 'style': {
      return acquireStyleResource(resource);
    }
    case 'script': {
      return acquireScriptResource(resource);
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

export function releaseResource(resource: Resource): void {
  switch (resource.type) {
    case 'head': {
      return releaseHeadResource(resource);
    }
    case 'style': {
      resource.count--;
      return;
    }
  }
}

function releaseHeadResource(resource: HeadResource): void {
  if (--resource.count === 0) {
    // the instance will have existed since we acquired it
    const instance: Instance = (resource.instance: any);
    const parent = instance.parentNode;
    if (parent) {
      parent.removeChild(instance);
    }
    resource.instance = null;
  }
}

function createResourceInstance(
  type: string,
  props: Object,
  ownerDocument: Document,
): Instance {
  const element = createElement(type, props, ownerDocument, HTML_NAMESPACE);
  setInitialProperties(element, type, props);
  markNodeAsResource(element);
  return element;
}

function createHeadResource(
  headResources: Map<string, HeadResource>,
  root: Document,
  instanceType: string,
  key: string,
  props: HeadProps,
): HeadResource {
  if (__DEV__) {
    if (headResources.has(key)) {
      console.error(
        'createHeadResource was called when a head Resource matching the same key already exists. This is a bug in React.',
      );
    }
  }

  const resource: HeadResource = {
    type: 'head',
    instanceType,
    props,

    count: 0,
    instance: null,
    root,
  };

  headResources.set(key, resource);
  return resource;
}

function createStyleResource(
  styleResources: Map<string, StyleResource>,
  root: FloatRoot,
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
  const existingEl = root.querySelector(
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
    root,
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
      // $FlowFixMe[incompatible-type]: found when upgrading Flow
      resource.hint = hint;
      // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
      const preloadProps = hint.props;
      adoptPreloadPropsForStyle(resource.props, hint.props);
      if (__DEV__) {
        (resource: any)._dev_preload_props = preloadProps;
      }
    }
  }

  return resource;
}

function adoptPreloadPropsForStyle(
  styleProps: StyleProps,
  preloadProps: PreloadProps,
): void {
  if (styleProps.crossOrigin == null)
    styleProps.crossOrigin = preloadProps.crossOrigin;
  if (styleProps.referrerPolicy == null)
    styleProps.referrerPolicy = preloadProps.referrerPolicy;
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
      getDocumentFromRoot(resource.root),
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

function createScriptResource(
  scriptResources: Map<string, ScriptResource>,
  root: FloatRoot,
  src: string,
  props: ScriptProps,
): ScriptResource {
  if (__DEV__) {
    if (scriptResources.has(src)) {
      console.error(
        'createScriptResource was called when a script Resource matching the same src already exists. This is a bug in React.',
      );
    }
  }

  const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  const existingEl = root.querySelector(
    `script[async][src="${limitedEscapedSrc}"]`,
  );
  const resource = {
    type: 'script',
    src,
    props,
    root,
    instance: existingEl || null,
  };
  scriptResources.set(src, resource);

  if (!existingEl) {
    const hint = preloadResources.get(src);
    if (hint) {
      // If a preload for this style Resource already exists there are certain props we want to adopt
      // on the style Resource, primarily focussed on making sure the style network pathways utilize
      // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
      // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
      const preloadProps = hint.props;
      adoptPreloadPropsForScript(props, hint.props);
      if (__DEV__) {
        (resource: any)._dev_preload_props = preloadProps;
      }
    }
  } else {
    markNodeAsResource(existingEl);
  }

  return resource;
}

function adoptPreloadPropsForScript(
  scriptProps: ScriptProps,
  preloadProps: PreloadProps,
): void {
  if (scriptProps.crossOrigin == null)
    scriptProps.crossOrigin = preloadProps.crossOrigin;
  if (scriptProps.referrerPolicy == null)
    scriptProps.referrerPolicy = preloadProps.referrerPolicy;
  if (scriptProps.integrity == null)
    scriptProps.referrerPolicy = preloadProps.integrity;
}

function createPreloadResource(
  ownerDocument: Document,
  href: string,
  props: PreloadProps,
): PreloadResource {
  const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
    href,
  );
  let element: null | Instance | HTMLElement = ownerDocument.querySelector(
    `link[rel="preload"][href="${limitedEscapedHref}"]`,
  );
  if (!element) {
    element = createResourceInstance('link', props, ownerDocument);
    appendResourceInstance(element, ownerDocument);
  } else {
    markNodeAsResource(element);
  }
  return {
    type: 'preload',
    href: href,
    ownerDocument,
    props,
    instance: element,
  };
}

function acquireHeadResource(resource: HeadResource): Instance {
  resource.count++;
  let instance = resource.instance;
  if (!instance) {
    const {props, root, instanceType} = resource;
    switch (instanceType) {
      case 'title': {
        const titles = root.querySelectorAll('title');
        for (let i = 0; i < titles.length; i++) {
          if (titles[i].textContent === props.children) {
            instance = resource.instance = titles[i];
            markNodeAsResource(instance);
            return instance;
          }
        }
      }
    }
    instance = resource.instance = createResourceInstance(
      instanceType,
      props,
      root,
    );

    if (instanceType === 'title') {
      prependResourceInstance(instance, root);
    } else {
      appendResourceInstance(instance, root);
    }
  }
  return instance;
}

function acquireStyleResource(resource: StyleResource): Instance {
  let instance = resource.instance;
  if (!instance) {
    const {props, root, precedence} = resource;
    const limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(
      props.href,
    );
    const existingEl = root.querySelector(
      `link[rel="stylesheet"][data-precedence][href="${limitedEscapedHref}"]`,
    );
    if (existingEl) {
      instance = resource.instance = existingEl;
      markNodeAsResource(instance);
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
      instance = resource.instance = createResourceInstance(
        'link',
        resource.props,
        getDocumentFromRoot(root),
      );

      attachLoadListeners(instance, resource);
      insertStyleInstance(instance, precedence, root);
    }
  }
  resource.count++;
  return instance;
}

function acquireScriptResource(resource: ScriptResource): Instance {
  let instance = resource.instance;
  if (!instance) {
    const {props, root} = resource;
    const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(
      props.src,
    );
    const existingEl = root.querySelector(
      `script[async][src="${limitedEscapedSrc}"]`,
    );
    if (existingEl) {
      instance = resource.instance = existingEl;
      markNodeAsResource(instance);
    } else {
      instance = resource.instance = createResourceInstance(
        'script',
        resource.props,
        getDocumentFromRoot(root),
      );

      appendResourceInstance(instance, getDocumentFromRoot(root));
    }
  }
  return instance;
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
  root: FloatRoot,
): void {
  const nodes = root.querySelectorAll(
    'link[rel="stylesheet"][data-precedence]',
  );
  const last = nodes.length ? nodes[nodes.length - 1] : null;
  let prior = last;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePrecedence = node.dataset.precedence;
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
    const parent =
      root.nodeType === DOCUMENT_NODE ? ((root: any): Document).head : root;
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

function prependResourceInstance(
  instance: Instance,
  ownerDocument: Document,
): void {
  if (__DEV__) {
    if (instance.tagName === 'LINK' && (instance: any).rel === 'stylesheet') {
      console.error(
        'prependResourceInstance was called with a stylesheet. Stylesheets must be' +
          ' inserted with insertStyleInstance instead. This is a bug in React.',
      );
    }
  }

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

function appendResourceInstance(
  instance: Instance,
  ownerDocument: Document,
): void {
  if (__DEV__) {
    if (instance.tagName === 'LINK' && (instance: any).rel === 'stylesheet') {
      console.error(
        'appendResourceInstance was called with a stylesheet. Stylesheets must be' +
          ' inserted with insertStyleInstance instead. This is a bug in React.',
      );
    }
  }
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

export function isHostResourceType(type: string, props: Props): boolean {
  switch (type) {
    case 'title': {
      return true;
    }
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
          const {href, onLoad, onError} = props;
          return !onLoad && !onError && typeof href === 'string';
        }
      }
      return false;
    }
    case 'script': {
      // We don't validate because it is valid to use async with onLoad/onError unlike combining
      // precedence with these for style resources
      const {src, async, onLoad, onError} = props;
      return (async: any) && typeof src === 'string' && !onLoad && !onError;
    }
  }
  return false;
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
