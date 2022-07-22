/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Container} from './ReactDOMHostConfig';
import type {RootTag} from 'react-reconciler/src/ReactRootTags';

import {ConcurrentRoot} from 'react-reconciler/src/ReactRootTags';
import {createElement, setInitialResourceProperties} from './ReactDOMComponent';
import {HTML_NAMESPACE} from '../shared/DOMNamespaces';
import {
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
  ELEMENT_NODE,
} from '../shared/HTMLNodeType';

type ResourceContainer = Element | Document | DocumentFragment;

export type ResourceHost = {
  map: ResourceMap,
  container: ResourceContainer,
};

const STYLE_RESOURCE = 'stylesheet';

type ResourceElementType = 'link';
export type Resource = {
  key: string,
  elementType: ResourceElementType,
  count: number,
  instance: Element,
  props: Object,
};

const CORS_NONE = '';
const CORS_ANON = 'anonymous';
const CORS_CREDS = 'use-credentials';

type ResourceMap = Map<string, Resource>;
type MapOfResourceMaps = Map<ResourceContainer, ResourceMap>;
let resourceMaps: ?MapOfResourceMaps = null;
const embeddedResourceElementMap: Map<string, Element> = new Map();
let pendingInsertionFragment: ?DocumentFragment = null;
let rootIsUsingResources = false;

export function acquireResource(
  key: string,
  elementType: ResourceElementType,
  props: Object,
  resourceHost: ResourceHost,
): Resource {
  const {map: resourceMap, container: resourceContainer} = resourceHost;
  let resource = resourceMap.get(key);
  if (!resource) {
    let domElement = embeddedResourceElementMap.get(key);
    if (domElement) {
      embeddedResourceElementMap.delete(key);
      setInitialResourceProperties(
        domElement,
        elementType,
        props,
        resourceContainer,
      );
    } else {
      // We cheat somewhat and substitute the resourceHost container instead of the rootContainer.
      // Sometimes they are the same but even when they are not, the ownerDocument should be.
      domElement = createElement(
        elementType,
        props,
        resourceContainer,
        HTML_NAMESPACE,
      );
      setInitialResourceProperties(
        domElement,
        elementType,
        props,
        resourceContainer,
      );
      insertResource(domElement, resourceHost);
    }
    resource = {
      key,
      elementType,
      count: 1,
      instance: domElement,
      props,
    };
    resourceMap.set(key, resource);
  } else if (resource.count++ === 0) {
    insertResource(resource.instance, resourceHost);
  }
  if (__DEV__) {
    validateResourceAndProps(resource, props, true);
  }
  return resource;
}

export function releaseResource(resource: Resource): void {
  if (--resource.count === 0) {
    const instance = resource.instance;
    if (instance && instance.parentNode != null) {
      instance.parentNode.removeChild(instance);
    }
  }
  if (resource.count < 0) {
    throw new Error(
      'HostResource count should never get below zero. this is a bug in React',
    );
  }
}

export function reconcileHydratedResources(rootContainerInstance: Container) {
  embeddedResourceElementMap.forEach((domElement, key) => {
    if (domElement.parentNode) {
      domElement.parentNode.removeChild(domElement);
    }
    embeddedResourceElementMap.clear();
  });
}

function insertResource(element: Element, resourceHost: ResourceHost) {
  const resourceContainer = resourceHost.container;
  switch (resourceContainer.nodeType) {
    case DOCUMENT_NODE: {
      const head = ((resourceContainer: any): Document).head;
      if (!head) {
        // If we do not have a head we are likely in the middle of replacing it on client render.
        // stash the insertions in a fragment. They will be inserted after mutation effects
        if (pendingInsertionFragment === null) {
          pendingInsertionFragment = ((resourceContainer: any): Document).createDocumentFragment();
        }
        ((pendingInsertionFragment: any): DocumentFragment).append(element);
      } else {
        head.appendChild(element);
      }
      break;
    }
    case DOCUMENT_FRAGMENT_NODE: {
      resourceContainer.append(element);
      break;
    }
    case ELEMENT_NODE: {
      resourceContainer.appendChild(element);
      break;
    }
    default: {
      throw new Error(
        `${'insertResource'} was called with a rootContainer with an unexpected nodeType.`,
      );
    }
  }
}

export function insertPendingResources(resourceHost: ResourceHost) {
  const resourceContainer = resourceHost.container;
  if (pendingInsertionFragment !== null) {
    if (resourceContainer.nodeType === DOCUMENT_NODE) {
      const head = ((resourceContainer: any): Document).head;
      if (!head) {
        pendingInsertionFragment = null;
        throw new Error(
          `${'insertPendingResources'} expected the containing Document to have a head element and one was not found.`,
        );
      }
      head.appendChild(((pendingInsertionFragment: any): DocumentFragment));
    }
    pendingInsertionFragment = null;
  }
}

export function prepareToHydrateResources(rootTag: RootTag) {
  rootIsUsingResources = rootTag === ConcurrentRoot;
  embeddedResourceElementMap.clear();
}

export function getRootResourceHost(
  rootContainer: Container,
  hydration: boolean,
): ResourceHost {
  if (resourceMaps === null) {
    resourceMaps = new Map();
  }
  let resourceContainer;
  switch (rootContainer.nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      resourceContainer = rootContainer;
      break;
    }
    case ELEMENT_NODE: {
      if (hydration) {
        // If we are hydrating we use the container as the ResourceHost unless that is not
        // possible given the tag type of the container
        const tagName = rootContainer.tagName;
        if (tagName !== 'HTML' && tagName !== 'HEAD') {
          resourceContainer = rootContainer;
          break;
        }
      }
      // If we are not hydrating or we have a container tag name that is incompatible with being
      // a ResourceHost we get the Root Node. Note that this intenitonally does not use ownerDocument
      // because we want to use a shadoRoot if this rootContainer is embedded within one.
      resourceContainer = rootContainer.getRootNode();
      break;
    }
    default: {
      throw new Error(
        `${'getRootResourceHost'} was called with a rootContainer with an unexpected nodeType.`,
      );
    }
  }

  let map = ((resourceMaps: any): MapOfResourceMaps).get(resourceContainer);
  if (!map) {
    map = new Map();
    ((resourceMaps: any): MapOfResourceMaps).set(resourceContainer, map);
  }
  return {
    map,
    container: resourceContainer,
  };
}

export function isResource(type: string, props: Object): boolean {
  const key = getResourceKeyFromTypeAndProps(type, props);
  if (key) {
    // This is potentially a Resource. We need to check if props contain
    // data attributes. Resources do not support data attributes.
    for (const prop in props) {
      if (prop.startsWith('data-')) {
        return false;
      }
    }
  }
  return !!key;
}

export function getResourceKeyFromTypeAndProps(
  type: string,
  props: Object,
): ?string {
  switch (type) {
    case 'link': {
      const {rel, href, crossOrigin, referrerPolicy} = props;

      if (!href) {
        return undefined;
      }

      let cors;
      if (crossOrigin === 'use-credentials') {
        cors = CORS_CREDS;
      } else if (typeof crossOrigin === 'string' || crossOrigin === true) {
        cors = CORS_ANON;
      } else {
        cors = CORS_NONE;
      }

      const referrer = referrerPolicy || '';

      // We use new-lines in the key because they are not valid in urls and thus there should
      // never be a collision between a href with no cors/referrer and another href with particular
      // cors & referrer.
      switch (rel) {
        case 'stylesheet': {
          return STYLE_RESOURCE + '\n' + href + '\n' + cors + referrer;
        }
        default:
          return undefined;
      }
    }
    default:
      return undefined;
  }
}

export function resourceFromElement(domElement: HTMLElement): boolean {
  if (rootIsUsingResources) {
    if (Object.keys(domElement.dataset).length) {
      // This element has data attributes. Managing data attributes for resources is impractical
      // because they suggest an intention to query / manipulate DOM Elmenets directly and
      // turning the React representation into a deduped reference is incongruent with such
      // intention.
      return false;
    }
    const type = domElement.tagName.toLowerCase();
    // This is really unfortunate that we need to create this intermediate props object.
    // Originally I tried to just pass the domElement as the props object since jsx prop names
    // match HTMLElement property names. However interface for the values passed to props more
    // closely matches attributes. crossOrigin in particular is a pain where the attribute being
    // missing is supposed to encode no cors but the property returns an empty string. However
    // when the attribute is the empty string we are supped to be in cors anonymous mode but the property
    // can also return empty string in this case (at least in JSDOM);
    const props = {
      rel: domElement.getAttribute('rel'),
      href: domElement.getAttribute('href'),
      crossOrigin: domElement.getAttribute('crossorigin'),
      referrerPolicy: domElement.getAttribute('referrerpolicy'),
    };

    const key = getResourceKeyFromTypeAndProps(type, props);

    if (key) {
      embeddedResourceElementMap.set(key, domElement);
      return true;
    }
  }

  return false;
}

// @TODO figure out how to utilize existing prop validation to do this instead of reinventing
let warnOnDivergentPropsStylesheet = null;
if (__DEV__) {
  warnOnDivergentPropsStylesheet = ['media', 'integrity', 'title'].map(
    propName => {
      return {
        propName,
        type: 'string',
      };
    },
  );
}

// This coercion is to normalize across semantically identical values (such as missing being equivalent to empty string)
// If the user used an improper type for a prop that will be warned on using the normal prop validation mechanism
function getPropertyValue(props, propertyInfo): any {
  switch (propertyInfo.type) {
    case 'string': {
      return props[propertyInfo.propName] || '';
    }
  }
}

export function validateResourceAndProps(
  resource: Resource,
  props: Object,
  created: boolean,
) {
  if (__DEV__) {
    switch (resource.elementType) {
      case 'link': {
        (warnOnDivergentPropsStylesheet: any).forEach(propertyInfo => {
          const currentProp = getPropertyValue(resource.props, propertyInfo);
          const nextProp = getPropertyValue(props, propertyInfo);
          if (currentProp !== nextProp) {
            const locationPropName = 'href';
            const propName = propertyInfo.propName;
            console.error(
              'A "%s" Resource (%s="%s") was %s with a different "%s" prop than the one used originally.' +
                ' The original value was "%s" and the new value is "%s". Either the "%s" value should' +
                ' be the same or this Resource should point to distinct "%s" location.',
              'stylesheet',
              locationPropName,
              props.href,
              created ? 'created' : 'updated',
              propName,
              currentProp,
              nextProp,
              propName,
              locationPropName,
            );
          }
        });
      }
    }
  }
}
