/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  validatePreloadResourceDifference,
  validateStyleResourceDifference,
  validateStyleAndHintProps,
  validateScriptResourceDifference,
  validateScriptAndHintProps,
  validateLinkPropsForStyleResource,
  validateLinkPropsForPreloadResource,
  validatePreloadArguments,
  validatePreinitArguments,
} from '../shared/ReactDOMResourceValidation';

type Props = {[string]: mixed};

type ResourceType = 'style' | 'font' | 'script';

type PreloadProps = {
  rel: 'preload',
  as: ResourceType,
  href: string,
  [string]: mixed,
};
type PreloadResource = {
  type: 'preload',
  as: ResourceType,
  href: string,
  props: PreloadProps,
  flushed: boolean,
};

type StyleProps = {
  rel: 'stylesheet',
  href: string,
  'data-precedence': string,
  [string]: mixed,
};
type StyleResource = {
  type: 'style',
  href: string,
  precedence: string,
  props: StyleProps,

  flushed: boolean,
  inShell: boolean, // flushedInShell
  hint: PreloadResource,
  set: Set<StyleResource>, // the precedence set this resource should be flushed in
};

type ScriptProps = {
  src: string,
  [string]: mixed,
};
type ScriptResource = {
  type: 'script',
  src: string,
  props: ScriptProps,

  flushed: boolean,
  hint: PreloadResource,
};

type TitleProps = {
  [string]: mixed,
};
type TitleResource = {
  type: 'title',
  props: TitleProps,

  flushed: boolean,
};

type MetaProps = {
  [string]: mixed,
};
type MetaResource = {
  type: 'meta',
  key: string,
  props: MetaProps,

  flushed: boolean,
};

type LinkProps = {
  href: string,
  rel: string,
  [string]: mixed,
};
type LinkResource = {
  type: 'link',
  props: LinkProps,

  flushed: boolean,
};

export type Resource = PreloadResource | StyleResource | ScriptResource;
export type HeadResource = TitleResource | MetaResource | LinkResource;

export type Resources = {
  // Request local cache
  preloadsMap: Map<string, PreloadResource>,
  stylesMap: Map<string, StyleResource>,
  scriptsMap: Map<string, ScriptResource>,
  headsMap: Map<string, HeadResource>,

  // Flushing queues for Resource dependencies
  charset: null | MetaResource,
  preconnects: Set<LinkResource>,
  fontPreloads: Set<PreloadResource>,
  // usedImagePreloads: Set<PreloadResource>,
  precedences: Map<string, Set<StyleResource>>,
  usedStylePreloads: Set<PreloadResource>,
  scripts: Set<ScriptResource>,
  usedScriptPreloads: Set<PreloadResource>,
  explicitStylePreloads: Set<PreloadResource>,
  // explicitImagePreloads: Set<PreloadResource>,
  explicitScriptPreloads: Set<PreloadResource>,
  headResources: Set<HeadResource>,

  // cache for tracking structured meta tags
  structuredMetaKeys: Map<string, MetaResource>,

  // Module-global-like reference for current boundary resources
  boundaryResources: ?BoundaryResources,
  ...
};

// @TODO add bootstrap script to implicit preloads
export function createResources(): Resources {
  return {
    // persistent
    preloadsMap: new Map(),
    stylesMap: new Map(),
    scriptsMap: new Map(),
    headsMap: new Map(),

    // cleared on flush
    charset: null,
    preconnects: new Set(),
    fontPreloads: new Set(),
    // usedImagePreloads: new Set(),
    precedences: new Map(),
    usedStylePreloads: new Set(),
    scripts: new Set(),
    usedScriptPreloads: new Set(),
    explicitStylePreloads: new Set(),
    // explicitImagePreloads: new Set(),
    explicitScriptPreloads: new Set(),
    headResources: new Set(),

    // cache for tracking structured meta tags
    structuredMetaKeys: new Map(),

    // like a module global for currently rendering boundary
    boundaryResources: null,
  };
}

export type BoundaryResources = Set<StyleResource>;

export function createBoundaryResources(): BoundaryResources {
  return new Set();
}

let currentResources: null | Resources = null;
const currentResourcesStack = [];

export function prepareToRenderResources(resources: Resources) {
  currentResourcesStack.push(currentResources);
  currentResources = resources;
}

export function finishRenderingResources() {
  currentResources = currentResourcesStack.pop();
}

export function setCurrentlyRenderingBoundaryResourcesTarget(
  resources: Resources,
  boundaryResources: null | BoundaryResources,
) {
  resources.boundaryResources = boundaryResources;
}

export const ReactDOMServerDispatcher = {
  preload,
  preinit,
};

type PreloadAs = ResourceType;
type PreloadOptions = {as: PreloadAs, crossOrigin?: string, integrity?: string};
function preload(href: string, options: PreloadOptions) {
  if (!currentResources) {
    // While we expect that preload calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }
  const resources = currentResources;
  if (__DEV__) {
    validatePreloadArguments(href, options);
  }
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null
  ) {
    const as = options.as;
    let resource = resources.preloadsMap.get(href);
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
      resource = createPreloadResource(
        resources,
        href,
        as,
        preloadPropsFromPreloadOptions(href, as, options),
      );
    }
    switch (as) {
      case 'font': {
        resources.fontPreloads.add(resource);
        break;
      }
      case 'style': {
        resources.explicitStylePreloads.add(resource);
        break;
      }
      case 'script': {
        resources.explicitScriptPreloads.add(resource);
        break;
      }
    }
  }
}

type PreinitAs = 'style' | 'script';
type PreinitOptions = {
  as: PreinitAs,
  precedence?: string,
  crossOrigin?: string,
  integrity?: string,
};
function preinit(href: string, options: PreinitOptions) {
  if (!currentResources) {
    // While we expect that preinit calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }
  const resources = currentResources;
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
    switch (as) {
      case 'style': {
        let resource = resources.stylesMap.get(href);
        if (resource) {
          if (__DEV__) {
            const latestProps = stylePropsFromPreinitOptions(
              href,
              resource.precedence,
              options,
            );
            validateStyleResourceDifference(resource.props, latestProps);
          }
        } else {
          const precedence = options.precedence || 'default';
          const resourceProps = stylePropsFromPreinitOptions(
            href,
            precedence,
            options,
          );
          resource = createStyleResource(
            resources,
            href,
            precedence,
            resourceProps,
          );
        }
        resource.set.add(resource);
        resources.explicitStylePreloads.add(resource.hint);

        return;
      }
      case 'script': {
        const src = href;
        let resource = resources.scriptsMap.get(src);
        if (resource) {
          if (__DEV__) {
            const latestProps = scriptPropsFromPreinitOptions(src, options);
            validateScriptResourceDifference(resource.props, latestProps);
          }
        } else {
          const scriptProps = scriptPropsFromPreinitOptions(src, options);
          resource = createScriptResource(resources, src, scriptProps);
          resources.scripts.add(resource);
        }
        return;
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
  };
}

function preloadPropsFromRawProps(
  href: string,
  as: ResourceType,
  rawProps: Props,
): PreloadProps {
  const props: PreloadProps = Object.assign({}, rawProps);
  props.href = href;
  props.rel = 'preload';
  props.as = as;
  if (as === 'font') {
    // Font preloads always need CORS anonymous mode so we set it here
    // regardless of the props provided. This should warn elsewhere in
    // dev
    props.crossOrigin = '';
  }
  return props;
}

function preloadAsStylePropsFromProps(
  href: string,
  props: Props | StyleProps,
): PreloadProps {
  return {
    rel: 'preload',
    as: 'style',
    href: href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
  };
}

function preloadAsScriptPropsFromProps(
  href: string,
  props: Props | ScriptProps,
): PreloadProps {
  return {
    rel: 'preload',
    as: 'script',
    href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    referrerPolicy: props.referrerPolicy,
  };
}

function createPreloadResource(
  resources: Resources,
  href: string,
  as: ResourceType,
  props: PreloadProps,
): PreloadResource {
  const {preloadsMap} = resources;
  if (__DEV__) {
    if (preloadsMap.has(href)) {
      console.error(
        'createPreloadResource was called when a preload Resource matching the same href already exists. This is a bug in React.',
      );
    }
  }

  const resource = {
    type: 'preload',
    as,
    href,
    flushed: false,
    props,
  };
  preloadsMap.set(href, resource);
  return resource;
}

function stylePropsFromRawProps(
  href: string,
  precedence: string,
  rawProps: Props,
): StyleProps {
  const props: StyleProps = Object.assign({}, rawProps);
  props.href = href;
  props.rel = 'stylesheet';
  props['data-precedence'] = precedence;
  delete props.precedence;

  return props;
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

function createStyleResource(
  resources: Resources,
  href: string,
  precedence: string,
  props: StyleProps,
): StyleResource {
  if (__DEV__) {
    if (resources.stylesMap.has(href)) {
      console.error(
        'createStyleResource was called when a style Resource matching the same href already exists. This is a bug in React.',
      );
    }
  }
  const {stylesMap, preloadsMap, precedences} = resources;

  // If this is the first time we've seen this precedence we encode it's position in our set even though
  // we don't add the resource to this set yet
  let precedenceSet = precedences.get(precedence);
  if (!precedenceSet) {
    precedenceSet = new Set();
    precedences.set(precedence, precedenceSet);
  }

  let hint = preloadsMap.get(href);
  if (hint) {
    // If a preload for this style Resource already exists there are certain props we want to adopt
    // on the style Resource, primarily focussed on making sure the style network pathways utilize
    // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
    // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
    adoptPreloadPropsForStyleProps(props, hint.props);

    if (__DEV__) {
      validateStyleAndHintProps(
        hint.props,
        props,
        (hint: any)._dev_implicit_construction,
      );
    }
  } else {
    const preloadResourceProps = preloadAsStylePropsFromProps(href, props);
    hint = createPreloadResource(
      resources,
      href,
      'style',
      preloadResourceProps,
    );
    if (__DEV__) {
      (hint: any)._dev_implicit_construction = true;
    }
    resources.explicitStylePreloads.add(hint);
  }

  const resource = {
    type: 'style',
    href,
    precedence,
    flushed: false,
    inShell: false,
    props,
    hint,
    set: precedenceSet,
  };
  stylesMap.set(href, resource);

  return resource;
}

function adoptPreloadPropsForStyleProps(
  resourceProps: StyleProps,
  preloadProps: PreloadProps,
): void {
  if (resourceProps.crossOrigin == null)
    resourceProps.crossOrigin = preloadProps.crossOrigin;
  if (resourceProps.referrerPolicy == null)
    resourceProps.referrerPolicy = preloadProps.referrerPolicy;
  if (resourceProps.title == null) resourceProps.title = preloadProps.title;
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

function scriptPropsFromRawProps(src: string, rawProps: Props): ScriptProps {
  const props = Object.assign({}, rawProps);
  props.src = src;
  return props;
}

function createScriptResource(
  resources: Resources,
  src: string,
  props: ScriptProps,
): ScriptResource {
  if (__DEV__) {
    if (resources.scriptsMap.has(src)) {
      console.error(
        'createScriptResource was called when a script Resource matching the same src already exists. This is a bug in React.',
      );
    }
  }
  const {scriptsMap, preloadsMap} = resources;

  let hint = preloadsMap.get(src);
  if (hint) {
    // If a preload for this style Resource already exists there are certain props we want to adopt
    // on the style Resource, primarily focussed on making sure the style network pathways utilize
    // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
    // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
    adoptPreloadPropsForScriptProps(props, hint.props);

    if (__DEV__) {
      validateScriptAndHintProps(
        hint.props,
        props,
        (hint: any)._dev_implicit_construction,
      );
    }
  } else {
    const preloadResourceProps = preloadAsScriptPropsFromProps(src, props);
    hint = createPreloadResource(
      resources,
      src,
      'script',
      preloadResourceProps,
    );
    if (__DEV__) {
      (hint: any)._dev_implicit_construction = true;
    }
    resources.explicitScriptPreloads.add(hint);
  }

  const resource = {
    type: 'script',
    src,
    flushed: false,
    props,
    hint,
  };
  scriptsMap.set(src, resource);

  return resource;
}

function adoptPreloadPropsForScriptProps(
  resourceProps: ScriptProps,
  preloadProps: PreloadProps,
): void {
  if (resourceProps.crossOrigin == null)
    resourceProps.crossOrigin = preloadProps.crossOrigin;
  if (resourceProps.referrerPolicy == null)
    resourceProps.referrerPolicy = preloadProps.referrerPolicy;
  if (resourceProps.integrity == null)
    resourceProps.integrity = preloadProps.integrity;
}

function titlePropsFromRawProps(
  child: string | number,
  rawProps: Props,
): TitleProps {
  const props = Object.assign({}, rawProps);
  props.children = child;
  return props;
}

export function resourcesFromElement(type: string, props: Props): boolean {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.',
    );
  }
  const resources = currentResources;
  switch (type) {
    case 'title': {
      let child = props.children;
      if (Array.isArray(child) && child.length === 1) {
        child = child[0];
      }
      if (typeof child === 'string' || typeof child === 'number') {
        const key = 'title::' + child;
        let resource = resources.headsMap.get(key);
        if (!resource) {
          resource = {
            type: 'title',
            props: titlePropsFromRawProps(child, props),
            flushed: false,
          };
          resources.headsMap.set(key, resource);
          resources.headResources.add(resource);
        }
        return true;
      }
      return false;
    }
    case 'meta': {
      let key, propertyPath;
      if (typeof props.charSet === 'string') {
        key = 'charSet';
      } else if (typeof props.content === 'string') {
        const contentKey = '::' + props.content;
        if (typeof props.httpEquiv === 'string') {
          key = 'httpEquiv::' + props.httpEquiv + contentKey;
        } else if (typeof props.name === 'string') {
          key = 'name::' + props.name + contentKey;
        } else if (typeof props.itemProp === 'string') {
          key = 'itemProp::' + props.itemProp + contentKey;
        } else if (typeof props.property === 'string') {
          const {property} = props;
          key = 'property::' + property + contentKey;
          propertyPath = property;
          const parentPath = property
            .split(':')
            .slice(0, -1)
            .join(':');
          const parentResource = resources.structuredMetaKeys.get(parentPath);
          if (parentResource) {
            key = parentResource.key + '::child::' + key;
          }
        }
      }
      if (key) {
        if (!resources.headsMap.has(key)) {
          const resource = {
            type: 'meta',
            key,
            props: Object.assign({}, props),
            flushed: false,
          };
          resources.headsMap.set(key, resource);
          if (key === 'charSet') {
            resources.charset = resource;
          } else {
            if (propertyPath) {
              resources.structuredMetaKeys.set(propertyPath, resource);
            }
            resources.headResources.add(resource);
          }
        }
        return true;
      }
      return false;
    }
  }
  return false;
}

// Construct a resource from link props.
export function resourcesFromLink(props: Props): boolean {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.',
    );
  }
  const resources = currentResources;

  const {rel, href} = props;
  if (!href || typeof href !== 'string' || !rel || typeof rel !== 'string') {
    return false;
  }

  let key = '';
  switch (rel) {
    case 'stylesheet': {
      const {onLoad, onError, precedence, disabled} = props;
      if (
        typeof precedence !== 'string' ||
        onLoad ||
        onError ||
        disabled != null
      ) {
        // This stylesheet is either not opted into Resource semantics or has conflicting properties which
        // disqualify it for such. We can still create a preload resource to help it load faster on the
        // client
        if (__DEV__) {
          validateLinkPropsForStyleResource(props);
        }
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        let preloadResource = resources.preloadsMap.get(href);
        if (!preloadResource) {
          preloadResource = createPreloadResource(
            // $FlowFixMe[incompatible-call] found when upgrading Flow
            resources,
            href,
            'style',
            preloadAsStylePropsFromProps(href, props),
          );
          if (__DEV__) {
            (preloadResource: any)._dev_implicit_construction = true;
          }
          resources.usedStylePreloads.add(preloadResource);
        }
        return false;
      } else {
        // We are able to convert this link element to a resource exclusively. We construct the relevant Resource
        // and return true indicating that this link was fully consumed.
        let resource = resources.stylesMap.get(href);

        if (resource) {
          if (__DEV__) {
            const resourceProps = stylePropsFromRawProps(
              href,
              precedence,
              props,
            );
            adoptPreloadPropsForStyleProps(resourceProps, resource.hint.props);
            validateStyleResourceDifference(resource.props, resourceProps);
          }
        } else {
          const resourceProps = stylePropsFromRawProps(href, precedence, props);
          resource = createStyleResource(
            // $FlowFixMe[incompatible-call] found when upgrading Flow
            currentResources,
            href,
            precedence,
            resourceProps,
          );
          resources.usedStylePreloads.add(resource.hint);
        }
        if (resources.boundaryResources) {
          resources.boundaryResources.add(resource);
        } else {
          resource.set.add(resource);
        }
        return true;
      }
    }
    case 'preload': {
      const {as} = props;
      switch (as) {
        case 'script':
        case 'style':
        case 'font': {
          if (__DEV__) {
            validateLinkPropsForPreloadResource(props);
          }
          let resource = resources.preloadsMap.get(href);
          if (resource) {
            if (__DEV__) {
              const originallyImplicit =
                (resource: any)._dev_implicit_construction === true;
              const latestProps = preloadPropsFromRawProps(href, as, props);
              validatePreloadResourceDifference(
                resource.props,
                originallyImplicit,
                latestProps,
                false,
              );
            }
          } else {
            resource = createPreloadResource(
              resources,
              href,
              as,
              preloadPropsFromRawProps(href, as, props),
            );
            switch (as) {
              case 'script': {
                resources.explicitScriptPreloads.add(resource);
                break;
              }
              case 'style': {
                resources.explicitStylePreloads.add(resource);
                break;
              }
              case 'font': {
                resources.fontPreloads.add(resource);
                break;
              }
            }
          }
          return true;
        }
      }
      break;
    }
  }
  if (props.onLoad || props.onError) {
    return false;
  }

  const sizes = typeof props.sizes === 'string' ? props.sizes : '';
  const media = typeof props.media === 'string' ? props.media : '';
  key =
    'rel:' + rel + '::href:' + href + '::sizes:' + sizes + '::media:' + media;
  let resource = resources.headsMap.get(key);
  if (!resource) {
    resource = {
      type: 'link',
      props: Object.assign({}, props),
      flushed: false,
    };
    resources.headsMap.set(key, resource);
    switch (rel) {
      case 'preconnect':
      case 'dns-prefetch': {
        resources.preconnects.add(resource);
        break;
      }
      default: {
        resources.headResources.add(resource);
      }
    }
  }
  return true;
}

// Construct a resource from link props.
export function resourcesFromScript(props: Props): boolean {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.',
    );
  }
  const resources = currentResources;
  const {src, async, onLoad, onError} = props;
  if (!src || typeof src !== 'string') {
    return false;
  }

  if (async) {
    if (onLoad || onError) {
      if (__DEV__) {
        // validate
      }
      let preloadResource = resources.preloadsMap.get(src);
      if (!preloadResource) {
        preloadResource = createPreloadResource(
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          resources,
          src,
          'script',
          preloadAsScriptPropsFromProps(src, props),
        );
        if (__DEV__) {
          (preloadResource: any)._dev_implicit_construction = true;
        }
        resources.usedScriptPreloads.add(preloadResource);
      }
    } else {
      let resource = resources.scriptsMap.get(src);
      if (resource) {
        if (__DEV__) {
          const latestProps = scriptPropsFromRawProps(src, props);
          adoptPreloadPropsForScriptProps(latestProps, resource.hint.props);
          validateScriptResourceDifference(resource.props, latestProps);
        }
      } else {
        const resourceProps = scriptPropsFromRawProps(src, props);
        resource = createScriptResource(resources, src, resourceProps);
        resources.scripts.add(resource);
      }
    }
    return true;
  }

  return false;
}

export function hoistResources(
  resources: Resources,
  source: BoundaryResources,
): void {
  const currentBoundaryResources = resources.boundaryResources;
  if (currentBoundaryResources) {
    source.forEach(resource => currentBoundaryResources.add(resource));
    source.clear();
  }
}

export function hoistResourcesToRoot(
  resources: Resources,
  boundaryResources: BoundaryResources,
): void {
  boundaryResources.forEach(resource => resource.set.add(resource));
  boundaryResources.clear();
}
