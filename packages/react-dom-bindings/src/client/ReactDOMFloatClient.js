/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Instance, Container} from './ReactDOMHostConfig';

import {getCurrentRootHostContainer} from 'react-reconciler/src/ReactFiberHostContext';

import hasOwnProperty from 'shared/hasOwnProperty';
import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals.js';
const {Dispatcher} = ReactDOMSharedInternals;
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';

import {DOCUMENT_NODE} from './HTMLNodeType';
import {SVG_NAMESPACE} from './DOMNamespaces';
import {
  validatePreloadArguments,
  validatePreinitArguments,
  getValueDescriptorExpectingObjectForWarning,
  getValueDescriptorExpectingEnumForWarning,
} from '../shared/ReactDOMResourceValidation';

import {setInitialProperties} from './ReactDOMComponent';
import {
  precacheFiberNode,
  getResourcesFromRoot,
  isOwnedInstance,
  markNodeAsHoistable,
} from './ReactDOMComponentTree';

// The resource types we support. currently they match the form for the as argument.
// In the future this may need to change, especially when modules / scripts are supported
type ResourceType = 'style' | 'font' | 'script';

type HoistableTagType = 'link' | 'meta' | 'title';
type TResource<T: 'stylesheet' | 'style' | 'script' | 'void'> = {
  type: T,
  instance: null | Instance,
  count: number,
};
type StylesheetResource = TResource<'stylesheet'>;
type StyleTagResource = TResource<'style'>;
type StyleResource = StyleTagResource | StylesheetResource;
type ScriptResource = TResource<'script'>;
type VoidResource = TResource<'void'>;
type Resource = StyleResource | ScriptResource | VoidResource;

type StyleTagProps = {
  'data-href': string,
  'data-precedence': string,
  [string]: mixed,
};
type StylesheetProps = {
  rel: 'stylesheet',
  href: string,
  'data-precedence': string,
  [string]: mixed,
};

type ScriptProps = {
  src: string,
  async: true,
  [string]: mixed,
};

type PreloadProps = {
  rel: 'preload',
  href: string,
  [string]: mixed,
};

export type RootResources = {
  hoistableStyles: Map<string, StyleResource>,
  hoistableScripts: Map<string, ScriptResource>,
};

// It is valid to preload even when we aren't actively rendering. For cases where Float functions are
// called when there is no rendering we track the last used document. It is not safe to insert
// arbitrary resources into the lastCurrentDocument b/c it may not actually be the document
// that the resource is meant to apply too (for example stylesheets or scripts). This is only
// appropriate for resources that don't really have a strict tie to the document itself for example
// preloads
let lastCurrentDocument: ?Document = null;

let previousDispatcher = null;
export function prepareToRenderResources(rootContainer: Container) {
  const rootNode = getHoistableRoot(rootContainer);
  lastCurrentDocument = getDocumentFromRoot(rootNode);

  previousDispatcher = Dispatcher.current;
  Dispatcher.current = ReactDOMClientDispatcher;
}

export function cleanupAfterRenderResources() {
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
}

export function prepareToCommitHoistables() {
  tagCaches = null;
}

// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> FloatClient -> Internals so this doesn't introduce a new one.
export const ReactDOMClientDispatcher = {
  prefetchDNS,
  preconnect,
  preload,
  preinit,
};

export type HoistableRoot = Document | ShadowRoot;

// global collections of Resources
const preloadPropsMap: Map<string, PreloadProps> = new Map();
const preconnectsSet: Set<string> = new Set();

// getRootNode is missing from IE and old jsdom versions
export function getHoistableRoot(container: Container): HoistableRoot {
  // $FlowFixMe[method-unbinding]
  return typeof container.getRootNode === 'function'
    ? /* $FlowFixMe[incompatible-return] Flow types this as returning a `Node`,
       * but it's either a `Document` or `ShadowRoot`. */
      container.getRootNode()
    : container.ownerDocument;
}

function getCurrentResourceRoot(): null | HoistableRoot {
  const currentContainer = getCurrentRootHostContainer();
  return currentContainer ? getHoistableRoot(currentContainer) : null;
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

function getDocumentFromRoot(root: HoistableRoot): Document {
  return root.ownerDocument || root;
}

function preconnectAs(
  rel: 'preconnect' | 'dns-prefetch',
  crossOrigin: null | '' | 'use-credentials',
  href: string,
) {
  const ownerDocument = getDocumentForPreloads();
  if (typeof href === 'string' && href && ownerDocument) {
    const limitedEscapedHref =
      escapeSelectorAttributeValueInsideDoubleQuotes(href);
    let key = `link[rel="${rel}"][href="${limitedEscapedHref}"]`;
    if (typeof crossOrigin === 'string') {
      key += `[crossorigin="${crossOrigin}"]`;
    }
    if (!preconnectsSet.has(key)) {
      preconnectsSet.add(key);

      const preconnectProps = {rel, crossOrigin, href};
      if (null === ownerDocument.querySelector(key)) {
        const preloadInstance = ownerDocument.createElement('link');
        setInitialProperties(preloadInstance, 'link', preconnectProps);
        markNodeAsHoistable(preloadInstance);
        (ownerDocument.head: any).appendChild(preloadInstance);
      }
    }
  }
}

// --------------------------------------
//      ReactDOM.prefetchDNS
// --------------------------------------
function prefetchDNS(href: string, options?: mixed) {
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null) {
      if (
        typeof options === 'object' &&
        hasOwnProperty.call(options, 'crossOrigin')
      ) {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      } else {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      }
    }
  }
  preconnectAs('dns-prefetch', null, href);
}

// --------------------------------------
//      ReactDOM.preconnect
// --------------------------------------
function preconnect(href: string, options?: {crossOrigin?: string}) {
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null && typeof options !== 'object') {
      console.error(
        'ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.',
        getValueDescriptorExpectingEnumForWarning(options),
      );
    } else if (options != null && typeof options.crossOrigin !== 'string') {
      console.error(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.',
        getValueDescriptorExpectingObjectForWarning(options.crossOrigin),
      );
    }
  }
  const crossOrigin =
    options == null || typeof options.crossOrigin !== 'string'
      ? null
      : options.crossOrigin === 'use-credentials'
      ? 'use-credentials'
      : '';
  preconnectAs('preconnect', crossOrigin, href);
}

// --------------------------------------
//      ReactDOM.preload
// --------------------------------------
type PreloadAs = ResourceType;
type PreloadOptions = {
  as: PreloadAs,
  crossOrigin?: string,
  integrity?: string,
  type?: string,
};
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
    const limitedEscapedHref =
      escapeSelectorAttributeValueInsideDoubleQuotes(href);
    const preloadKey = `link[rel="preload"][as="${as}"][href="${limitedEscapedHref}"]`;
    let key = preloadKey;
    switch (as) {
      case 'style':
        key = getStyleKey(href);
        break;
      case 'script':
        key = getScriptKey(href);
        break;
    }
    if (!preloadPropsMap.has(key)) {
      const preloadProps = preloadPropsFromPreloadOptions(href, as, options);
      preloadPropsMap.set(key, preloadProps);

      if (null === ownerDocument.querySelector(preloadKey)) {
        const preloadInstance = ownerDocument.createElement('link');
        setInitialProperties(preloadInstance, 'link', preloadProps);
        markNodeAsHoistable(preloadInstance);
        (ownerDocument.head: any).appendChild(preloadInstance);
      }
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
    type: options.type,
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
      if (as === 'style' || as === 'script') {
        // We are going to emit a preload as a best effort fallback since this preinit
        // was called outside of a render. Given the passive nature of this fallback
        // we do not warn in dev when props disagree if there happens to already be a
        // matching preload with this href
        const preloadDocument = getDocumentForPreloads();
        if (preloadDocument) {
          const limitedEscapedHref =
            escapeSelectorAttributeValueInsideDoubleQuotes(href);
          const preloadKey = `link[rel="preload"][as="${as}"][href="${limitedEscapedHref}"]`;
          let key = preloadKey;
          switch (as) {
            case 'style':
              key = getStyleKey(href);
              break;
            case 'script':
              key = getScriptKey(href);
              break;
          }
          if (!preloadPropsMap.has(key)) {
            const preloadProps = preloadPropsFromPreinitOptions(
              href,
              as,
              options,
            );
            preloadPropsMap.set(key, preloadProps);

            if (null === preloadDocument.querySelector(preloadKey)) {
              const preloadInstance = preloadDocument.createElement('link');
              setInitialProperties(preloadInstance, 'link', preloadProps);
              markNodeAsHoistable(preloadInstance);
              (preloadDocument.head: any).appendChild(preloadInstance);
            }
          }
        }
      }
      return;
    }

    switch (as) {
      case 'style': {
        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;

        const key = getStyleKey(href);
        const precedence = options.precedence || 'default';

        // Check if this resource already exists
        let resource = styles.get(key);
        if (resource) {
          // We can early return. The resource exists and there is nothing
          // more to do
          return;
        }

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = resourceRoot.querySelector(
          getStylesheetSelectorFromKey(key),
        );
        if (!instance) {
          // Construct a new instance and insert it
          const stylesheetProps = stylesheetPropsFromPreinitOptions(
            href,
            precedence,
            options,
          );
          const preloadProps = preloadPropsMap.get(key);
          if (preloadProps) {
            adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
          }
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          instance = ownerDocument.createElement('link');
          markNodeAsHoistable(instance);
          setInitialProperties(instance, 'link', stylesheetProps);
          insertStylesheet(instance, precedence, resourceRoot);
        }

        // Construct a Resource and cache it
        resource = {
          type: 'stylesheet',
          instance,
          count: 1,
        };
        styles.set(key, resource);
        return;
      }
      case 'script': {
        const src = href;
        const scripts = getResourcesFromRoot(resourceRoot).hoistableScripts;

        const key = getScriptKey(src);

        // Check if this resource already exists
        let resource = scripts.get(key);
        if (resource) {
          // We can early return. The resource exists and there is nothing
          // more to do
          return;
        }

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = resourceRoot.querySelector(
          getScriptSelectorFromKey(key),
        );
        if (!instance) {
          // Construct a new instance and insert it
          const scriptProps = scriptPropsFromPreinitOptions(src, options);
          // Adopt certain preload props
          const preloadProps = preloadPropsMap.get(key);
          if (preloadProps) {
            adoptPreloadPropsForScript(scriptProps, preloadProps);
          }
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          instance = ownerDocument.createElement('script');
          markNodeAsHoistable(instance);
          setInitialProperties(instance, 'link', scriptProps);
          (ownerDocument.head: any).appendChild(instance);
        }

        // Construct a Resource and cache it
        resource = {
          type: 'script',
          instance,
          count: 1,
        };
        scripts.set(key, resource);
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

function stylesheetPropsFromPreinitOptions(
  href: string,
  precedence: string,
  options: PreinitOptions,
): StylesheetProps {
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

type StyleTagQualifyingProps = {
  href: string,
  precedence: string,
  [string]: mixed,
};

type StylesheetQualifyingProps = {
  rel: 'stylesheet',
  href: string,
  precedence: string,
  [string]: mixed,
};

// This function is called in begin work and we should always have a currentDocument set
export function getResource(
  type: string,
  currentProps: any,
  pendingProps: any,
): null | Resource {
  const resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) {
    throw new Error(
      '"resourceRoot" was expected to exist. This is a bug in React.',
    );
  }
  switch (type) {
    case 'meta':
    case 'title': {
      return null;
    }
    case 'style': {
      if (
        typeof pendingProps.precedence === 'string' &&
        typeof pendingProps.href === 'string'
      ) {
        const key = getStyleKey(pendingProps.href);
        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;
        let resource = styles.get(key);
        if (!resource) {
          resource = {
            type: 'style',
            instance: null,
            count: 0,
          };
          styles.set(key, resource);
        }
        return resource;
      }
      return {
        type: 'void',
        instance: null,
        count: 0,
      };
    }
    case 'link': {
      if (
        pendingProps.rel === 'stylesheet' &&
        typeof pendingProps.href === 'string' &&
        typeof pendingProps.precedence === 'string'
      ) {
        const qualifiedProps: StylesheetQualifyingProps = pendingProps;
        const key = getStyleKey(qualifiedProps.href);

        const styles = getResourcesFromRoot(resourceRoot).hoistableStyles;

        let resource = styles.get(key);
        if (!resource) {
          // We asserted this above but Flow can't figure out that the type satisfies
          const ownerDocument = getDocumentFromRoot(resourceRoot);
          resource = {
            type: 'stylesheet',
            instance: null,
            count: 0,
          };
          styles.set(key, resource);
          if (!preloadPropsMap.has(key)) {
            preloadStylesheet(
              ownerDocument,
              key,
              preloadPropsFromStylesheet(qualifiedProps),
            );
          }
        }
        return resource;
      }
      return null;
    }
    case 'script': {
      if (typeof pendingProps.src === 'string' && pendingProps.async === true) {
        const scriptProps: ScriptProps = pendingProps;
        const key = getScriptKey(scriptProps.src);
        const scripts = getResourcesFromRoot(resourceRoot).hoistableScripts;

        let resource = scripts.get(key);
        if (!resource) {
          resource = {
            type: 'script',
            instance: null,
            count: 0,
          };
          scripts.set(key, resource);
        }
        return resource;
      }
      return {
        type: 'void',
        instance: null,
        count: 0,
      };
    }
    default: {
      throw new Error(
        `getResource encountered a type it did not expect: "${type}". this is a bug in React.`,
      );
    }
  }
}

function styleTagPropsFromRawProps(
  rawProps: StyleTagQualifyingProps,
): StyleTagProps {
  return {
    ...rawProps,
    'data-href': rawProps.href,
    'data-precedence': rawProps.precedence,
    href: null,
    precedence: null,
  };
}

function getStyleKey(href: string) {
  const limitedEscapedHref =
    escapeSelectorAttributeValueInsideDoubleQuotes(href);
  return `href~="${limitedEscapedHref}"`;
}

function getStyleTagSelectorFromKey(key: string) {
  return `style[data-${key}]`;
}

function getStylesheetSelectorFromKey(key: string) {
  return `link[rel="stylesheet"][${key}]`;
}

function getPreloadStylesheetSelectorFromKey(key: string) {
  return `link[rel="preload"][as="style"][${key}]`;
}

function stylesheetPropsFromRawProps(
  rawProps: StylesheetQualifyingProps,
): StylesheetProps {
  return {
    ...rawProps,
    'data-precedence': rawProps.precedence,
    precedence: null,
  };
}

function preloadStylesheet(
  ownerDocument: Document,
  key: string,
  preloadProps: PreloadProps,
) {
  preloadPropsMap.set(key, preloadProps);

  if (!ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) {
    // There is no matching stylesheet instance in the Document.
    // We will insert a preload now to kick off loading because
    // we expect this stylesheet to commit
    if (
      null ===
      ownerDocument.querySelector(getPreloadStylesheetSelectorFromKey(key))
    ) {
      const preloadInstance = ownerDocument.createElement('link');
      setInitialProperties(preloadInstance, 'link', preloadProps);
      markNodeAsHoistable(preloadInstance);
      (ownerDocument.head: any).appendChild(preloadInstance);
    }
  }
}

function preloadPropsFromStylesheet(
  props: StylesheetQualifyingProps,
): PreloadProps {
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

function getScriptKey(src: string): string {
  const limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  return `[src="${limitedEscapedSrc}"]`;
}

function getScriptSelectorFromKey(key: string): string {
  return 'script[async]' + key;
}

// --------------------------------------
//      Hoistable Resource Reconciliation
// --------------------------------------

export function acquireResource(
  hoistableRoot: HoistableRoot,
  resource: Resource,
  props: any,
): null | Instance {
  resource.count++;
  if (resource.instance === null) {
    switch (resource.type) {
      case 'style': {
        const qualifiedProps: StyleTagQualifyingProps = props;
        const key = getStyleKey(qualifiedProps.href);

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = hoistableRoot.querySelector(
          getStyleTagSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        const styleProps = styleTagPropsFromRawProps(props);
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('style');

        markNodeAsHoistable(instance);
        setInitialProperties(instance, 'style', styleProps);
        insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        resource.instance = instance;

        return instance;
      }
      case 'stylesheet': {
        // This typing is enforce by `getResource`. If we change the logic
        // there for what qualifies as a stylesheet resource we need to ensure
        // this cast still makes sense;
        const qualifiedProps: StylesheetQualifyingProps = props;
        const key = getStyleKey(qualifiedProps.href);

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = hoistableRoot.querySelector(
          getStylesheetSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        const stylesheetProps = stylesheetPropsFromRawProps(props);
        const preloadProps = preloadPropsMap.get(key);
        if (preloadProps) {
          adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
        }

        // Construct and insert a new instance
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('link');
        markNodeAsHoistable(instance);
        const linkInstance: HTMLLinkElement = (instance: any);
        (linkInstance: any)._p = new Promise((resolve, reject) => {
          linkInstance.onload = resolve;
          linkInstance.onerror = reject;
        }).then(
          () => ((linkInstance: any)._p.s = 'l'),
          () => ((linkInstance: any)._p.s = 'e'),
        );
        setInitialProperties(instance, 'link', stylesheetProps);
        insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        resource.instance = instance;

        return instance;
      }
      case 'script': {
        // This typing is enforce by `getResource`. If we change the logic
        // there for what qualifies as a stylesheet resource we need to ensure
        // this cast still makes sense;
        const borrowedScriptProps: ScriptProps = props;
        const key = getScriptKey(borrowedScriptProps.src);

        // Attempt to hydrate instance from DOM
        let instance: null | Instance = hoistableRoot.querySelector(
          getScriptSelectorFromKey(key),
        );
        if (instance) {
          resource.instance = instance;
          markNodeAsHoistable(instance);
          return instance;
        }

        let scriptProps = borrowedScriptProps;
        const preloadProps = preloadPropsMap.get(key);
        if (preloadProps) {
          scriptProps = {...borrowedScriptProps};
          adoptPreloadPropsForScript(scriptProps, preloadProps);
        }

        // Construct and insert a new instance
        const ownerDocument = getDocumentFromRoot(hoistableRoot);
        instance = ownerDocument.createElement('script');
        markNodeAsHoistable(instance);
        setInitialProperties(instance, 'link', scriptProps);
        (ownerDocument.head: any).appendChild(instance);
        resource.instance = instance;

        return instance;
      }
      case 'void': {
        return null;
      }
      default: {
        throw new Error(
          `acquireResource encountered a resource type it did not expect: "${resource.type}". this is a bug in React.`,
        );
      }
    }
  }
  return resource.instance;
}

export function releaseResource(resource: Resource): void {
  resource.count--;
}

function insertStylesheet(
  instance: Instance,
  precedence: string,
  root: HoistableRoot,
): void {
  const nodes = root.querySelectorAll(
    'link[rel="stylesheet"][data-precedence],style[data-precedence]',
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
      root.nodeType === DOCUMENT_NODE
        ? ((((root: any): Document).head: any): Element)
        : ((root: any): ShadowRoot);
    parent.insertBefore(instance, parent.firstChild);
  }
}

function adoptPreloadPropsForStylesheet(
  stylesheetProps: StylesheetProps,
  preloadProps: PreloadProps,
): void {
  if (stylesheetProps.crossOrigin == null)
    stylesheetProps.crossOrigin = preloadProps.crossOrigin;
  if (stylesheetProps.referrerPolicy == null)
    stylesheetProps.referrerPolicy = preloadProps.referrerPolicy;
  if (stylesheetProps.title == null) stylesheetProps.title = preloadProps.title;
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

// --------------------------------------
//      Hoistable Element Reconciliation
// --------------------------------------

type KeyedTagCache = Map<string, Array<Element>>;
type DocumentTagCaches = Map<Document, KeyedTagCache>;
let tagCaches: null | DocumentTagCaches = null;

export function hydrateHoistable(
  hoistableRoot: HoistableRoot,
  type: HoistableTagType,
  props: any,
  internalInstanceHandle: Object,
): Instance {
  const ownerDocument = getDocumentFromRoot(hoistableRoot);

  let instance: ?Instance = null;
  getInstance: switch (type) {
    case 'title': {
      instance = ownerDocument.getElementsByTagName('title')[0];
      if (
        !instance ||
        isOwnedInstance(instance) ||
        instance.namespaceURI === SVG_NAMESPACE ||
        instance.hasAttribute('itemprop')
      ) {
        instance = ownerDocument.createElement(type);
        (ownerDocument.head: any).insertBefore(
          instance,
          ownerDocument.querySelector('head > title'),
        );
      }
      setInitialProperties(instance, type, props);
      precacheFiberNode(internalInstanceHandle, instance);
      markNodeAsHoistable(instance);
      return instance;
    }
    case 'link': {
      const cache = getHydratableHoistableCache('link', 'href', ownerDocument);
      const key = type + (props.href || '');
      const maybeNodes = cache.get(key);
      if (maybeNodes) {
        const nodes = maybeNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (
            node.getAttribute('href') !==
              (props.href == null ? null : props.href) ||
            node.getAttribute('rel') !==
              (props.rel == null ? null : props.rel) ||
            node.getAttribute('title') !==
              (props.title == null ? null : props.title) ||
            node.getAttribute('crossorigin') !==
              (props.crossOrigin == null ? null : props.crossOrigin)
          ) {
            // mismatch, try the next node;
            continue;
          }
          instance = node;
          nodes.splice(i, 1);
          break getInstance;
        }
      }
      instance = ownerDocument.createElement(type);
      setInitialProperties(instance, type, props);
      (ownerDocument.head: any).appendChild(instance);
      break;
    }
    case 'meta': {
      const cache = getHydratableHoistableCache(
        'meta',
        'content',
        ownerDocument,
      );
      const key = type + (props.content || '');
      const maybeNodes = cache.get(key);
      if (maybeNodes) {
        const nodes = maybeNodes;
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // We coerce content to string because it is the most likely one to
          // use a `toString` capable value. For the rest we just do identity match
          // passing non-strings here is not really valid anyway.
          if (__DEV__) {
            checkAttributeStringCoercion(props.content, 'content');
          }
          if (
            node.getAttribute('content') !==
              (props.content == null ? null : '' + props.content) ||
            node.getAttribute('name') !==
              (props.name == null ? null : props.name) ||
            node.getAttribute('property') !==
              (props.property == null ? null : props.property) ||
            node.getAttribute('http-equiv') !==
              (props.httpEquiv == null ? null : props.httpEquiv) ||
            node.getAttribute('charset') !==
              (props.charSet == null ? null : props.charSet)
          ) {
            // mismatch, try the next node;
            continue;
          }
          instance = node;
          nodes.splice(i, 1);
          break getInstance;
        }
      }
      instance = ownerDocument.createElement(type);
      setInitialProperties(instance, type, props);
      (ownerDocument.head: any).appendChild(instance);
      break;
    }
    default:
      throw new Error(
        `getNodesForType encountered a type it did not expect: "${type}". This is a bug in React.`,
      );
  }

  // This node is a match
  precacheFiberNode(internalInstanceHandle, instance);
  markNodeAsHoistable(instance);
  return instance;
}

function getHydratableHoistableCache(
  type: HoistableTagType,
  keyAttribute: string,
  ownerDocument: Document,
): KeyedTagCache {
  let cache: KeyedTagCache;
  let caches: DocumentTagCaches;
  if (tagCaches === null) {
    cache = new Map();
    caches = tagCaches = new Map();
    caches.set(ownerDocument, cache);
  } else {
    caches = tagCaches;
    const maybeCache = caches.get(ownerDocument);
    if (!maybeCache) {
      cache = new Map();
      caches.set(ownerDocument, cache);
    } else {
      cache = maybeCache;
    }
  }

  if (cache.has(type)) {
    // We use type as a special key that signals that this cache has been seeded for this type
    return cache;
  }

  // Mark this cache as seeded for this type
  cache.set(type, (null: any));

  const nodes = ownerDocument.getElementsByTagName(type);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (
      !isOwnedInstance(node) &&
      (type !== 'link' || node.getAttribute('rel') !== 'stylesheet') &&
      node.namespaceURI !== SVG_NAMESPACE
    ) {
      const nodeKey = node.getAttribute(keyAttribute) || '';
      const key = type + nodeKey;
      const existing = cache.get(key);
      if (existing) {
        existing.push(node);
      } else {
        cache.set(key, [node]);
      }
    }
  }

  return cache;
}

export function mountHoistable(
  hoistableRoot: HoistableRoot,
  type: HoistableTagType,
  instance: Instance,
): void {
  const ownerDocument = getDocumentFromRoot(hoistableRoot);
  (ownerDocument.head: any).insertBefore(
    instance,
    type === 'title' ? ownerDocument.querySelector('head > title') : null,
  );
}

export function unmountHoistable(instance: Instance): void {
  (instance.parentNode: any).removeChild(instance);
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
