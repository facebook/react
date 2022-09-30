/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  validateLinkPropsForStyleResource,
  validateLinkPropsForPreloadResource,
  validatePreloadArguments,
  validatePreinitArguments,
} from '../shared/ReactDOMResourceValidation';

type Props = {[string]: mixed};

type ResourceType = 'style' | 'font';

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
  'data-rprec': string,
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
};

export type Resource = PreloadResource | StyleResource;

export type Resources = {
  // Request local cache
  preloadsMap: Map<string, PreloadResource>,
  stylesMap: Map<string, StyleResource>,

  // Flushing queues for Resource dependencies
  explicitPreloads: Set<PreloadResource>,
  implicitPreloads: Set<PreloadResource>,
  precedences: Map<string, Set<StyleResource>>,

  // Module-global-like reference for current boundary resources
  boundaryResources: ?BoundaryResources,
};

// @TODO add bootstrap script to implicit preloads
export function createResources(): Resources {
  return {
    // persistent
    preloadsMap: new Map(),
    stylesMap: new Map(),

    // cleared on flush
    explicitPreloads: new Set(),
    implicitPreloads: new Set(),
    precedences: new Map(),

    // like a module global for currently rendering boundary
    boundaryResources: null,
  };
}

export type BoundaryResources = Set<StyleResource>;

export function createBoundaryResources(): BoundaryResources {
  return new Set();
}

export function mergeBoundaryResources(
  target: BoundaryResources,
  source: BoundaryResources,
) {
  source.forEach(resource => target.add(resource));
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
type PreloadOptions = {as: PreloadAs, crossOrigin?: string};
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
    let resource = currentResources.preloadsMap.get(href);
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
        currentResources,
        href,
        as,
        preloadPropsFromPreloadOptions(href, as, options),
      );
    }
    captureExplicitPreloadResourceDependency(currentResources, resource);
  }
}

type PreinitAs = 'style';
type PreinitOptions = {
  as: PreinitAs,
  precedence?: string,
  crossOrigin?: string,
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
        const precedence = options.precedence || 'default';

        let resource = currentResources.stylesMap.get(href);
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
            currentResources,
            href,
            precedence,
            resourceProps,
          );
        }

        // Do not associate preinit style resources with any specific boundary regardless of where it is called
        captureStyleResourceDependency(currentResources, null, resource);

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
  props['data-rprec'] = precedence;
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
    'data-rprec': precedence,
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
  const {stylesMap, preloadsMap} = resources;

  let hint = preloadsMap.get(href);
  if (hint) {
    // If a preload for this style Resource already exists there are certain props we want to adopt
    // on the style Resource, primarily focussed on making sure the style network pathways utilize
    // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
    // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
    const preloadProps = hint.props;
    if (props.crossOrigin == null) props.crossOrigin = preloadProps.crossOrigin;
    if (props.referrerPolicy == null)
      props.referrerPolicy = preloadProps.referrerPolicy;
    if (props.media == null) props.media = preloadProps.media;
    if (props.title == null) props.title = preloadProps.title;

    if (__DEV__) {
      validateStyleAndHintProps(
        preloadProps,
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
    captureImplicitPreloadResourceDependency(resources, hint);
  }

  const resource = {
    type: 'style',
    href,
    precedence,
    flushed: false,
    inShell: false,
    props,
    hint,
  };
  stylesMap.set(href, resource);

  return resource;
}

function captureStyleResourceDependency(
  resources: Resources,
  boundaryResources: ?BoundaryResources,
  styleResource: StyleResource,
): void {
  const {precedences} = resources;
  const {precedence} = styleResource;

  if (boundaryResources) {
    boundaryResources.add(styleResource);
    if (!precedences.has(precedence)) {
      precedences.set(precedence, new Set());
    }
  } else {
    let set = precedences.get(precedence);
    if (!set) {
      set = new Set();
      precedences.set(precedence, set);
    }
    set.add(styleResource);
  }
}

function captureExplicitPreloadResourceDependency(
  resources: Resources,
  preloadResource: PreloadResource,
): void {
  resources.explicitPreloads.add(preloadResource);
}

function captureImplicitPreloadResourceDependency(
  resources: Resources,
  preloadResource: PreloadResource,
): void {
  resources.implicitPreloads.add(preloadResource);
}

// Construct a resource from link props.
export function resourcesFromLink(props: Props): boolean {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.',
    );
  }
  const {rel, href} = props;
  if (!href || typeof href !== 'string') {
    return false;
  }

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
        let preloadResource = currentResources.preloadsMap.get(href);
        if (!preloadResource) {
          preloadResource = createPreloadResource(
            currentResources,
            href,
            'style',
            preloadAsStylePropsFromProps(href, props),
          );
          if (__DEV__) {
            (preloadResource: any)._dev_implicit_construction = true;
          }
        }
        captureImplicitPreloadResourceDependency(
          currentResources,
          preloadResource,
        );
        return false;
      } else {
        // We are able to convert this link element to a resource exclusively. We construct the relevant Resource
        // and return true indicating that this link was fully consumed.
        let resource = currentResources.stylesMap.get(href);
        if (resource) {
          if (__DEV__) {
            const resourceProps = stylePropsFromRawProps(
              href,
              precedence,
              props,
            );
            validateStyleResourceDifference(resource.props, resourceProps);
          }
        } else {
          const resourceProps = stylePropsFromRawProps(href, precedence, props);
          resource = createStyleResource(
            currentResources,
            href,
            precedence,
            resourceProps,
          );
        }
        captureStyleResourceDependency(
          currentResources,
          currentResources.boundaryResources,
          resource,
        );
        return true;
      }
    }
    case 'preload': {
      const {as, onLoad, onError} = props;
      if (onLoad || onError) {
        // these props signal an opt-out of Resource semantics. We don't warn because there is no
        // conflicting opt-in like there is with Style Resources
        return false;
      }
      switch (as) {
        case 'style':
        case 'font': {
          if (__DEV__) {
            validateLinkPropsForPreloadResource(props);
          }
          let resource = currentResources.preloadsMap.get(href);
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
              currentResources,
              href,
              as,
              preloadPropsFromRawProps(href, as, props),
            );
          }
          captureExplicitPreloadResourceDependency(currentResources, resource);
          return true;
        }
      }
      return false;
    }
  }
  return false;
}

export function hoistResources(
  resources: Resources,
  source: BoundaryResources,
): void {
  if (resources.boundaryResources) {
    mergeBoundaryResources(resources.boundaryResources, source);
    source.clear();
  }
}

export function hoistResourcesToRoot(
  resources: Resources,
  boundaryResources: BoundaryResources,
): void {
  boundaryResources.forEach(resource => {
    // all precedences are set upon discovery. so we know we will have a set here
    const set: Set<StyleResource> = (resources.precedences.get(
      resource.precedence,
    ): any);
    set.add(resource);
  });
  boundaryResources.clear();
}
