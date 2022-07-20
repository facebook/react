/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Container} from './ReactDOMHostConfig';

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

export type Resource = {
  key: string,
  type: string,
  props: Object,
  count: number,
  instance: Element,
};

const CORS_NONE = '';
const CORS_ANON = 'anonymous';
const CORS_CREDS = 'use-credentials';

type ResourceMap = Map<string, Resource>;
type MapOfResourceMaps = Map<ResourceContainer, ResourceMap>;
let resourceMaps: ?MapOfResourceMaps = null;
const embeddedResourceElementMap: Map<string, Element> = new Map();
let pendingInsertionFragment: ?DocumentFragment = null;

export function resourceFromElement(domElement: Element): void {
  const href = domElement.getAttribute('href');
  const crossOriginAttr = domElement.getAttribute('crossorigin');
  if (!href) {
    return;
  }

  let crossOrigin;
  if (crossOriginAttr === 'use-credentials') {
    crossOrigin = CORS_CREDS;
  } else if (crossOriginAttr === null) {
    crossOrigin = CORS_NONE;
  } else {
    crossOrigin = CORS_ANON;
  }
  const key = href + crossOrigin;
  embeddedResourceElementMap.set(key, domElement);
}

export function acquireResource(
  type: string,
  props: Object,
  rootContainerInstance: Container,
  resourceHost: ResourceHost,
): Resource {
  const href = props.href;
  let crossOrigin;
  const crossOriginProp = props.crossOrigin;
  if (crossOriginProp === 'use-credentials') {
    crossOrigin = CORS_CREDS;
  } else if (typeof crossOriginProp === 'string' || crossOriginProp === true) {
    crossOrigin = CORS_ANON;
  } else {
    crossOrigin = CORS_NONE;
  }
  const key = href + crossOrigin;

  const resourceMap = resourceHost.map;
  let resource = resourceMap.get(key);
  if (!resource) {
    let domElement = embeddedResourceElementMap.get(key);
    if (domElement) {
      embeddedResourceElementMap.delete(key);
    } else {
      domElement = createElement(
        type,
        props,
        rootContainerInstance,
        HTML_NAMESPACE,
      );
      setInitialResourceProperties(
        domElement,
        type,
        props,
        rootContainerInstance,
      );
    }
    insertResource(domElement, resourceHost);
    resource = {
      key,
      type,
      props,
      count: 0,
      instance: domElement,
    };
    resourceMap.set(key, resource);
  }
  resource.count++;
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

export function prepareToHydrateResources() {
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
