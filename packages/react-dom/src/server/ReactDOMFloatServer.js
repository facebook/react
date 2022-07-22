/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {pushDispatcher, popDispatcher} from '../shared/ReactDOMDispatcher';

let currentResourceMap = null;

export const DNS_PREFETCH = 0;
export const PRECONNECT = 1;
export const PREFETCH = 2;
export const PRELOAD = 3;
export const PREINIT = 4;
type Priority = 0 | 1 | 2 | 3 | 4;

export const CORS_NONE = 0;
export const CORS_ANON = 1;
export const CORS_CREDS = 2;

export const STYLE_RESOURCE = 'stylesheet';
export const FONT_RESOURCE = 'font';
export const SCRIPT_RESOURCE = 'script';

type ResourceType = 'stylesheet' | 'script';
type ResourceElementType = 'link' | 'script';
export type Resource = {
  flushed: boolean,
  priority: Priority,
  type: ResourceType,
  elementType: ResourceElementType,
  key: string,
  props: Object,
  chunks: Array<Chunk | PrecomputedChunk>,
};

type ResourceMap = Map<string, Resource>;

export function prepareToRender(resourceMap: ResourceMap) {
  currentResourceMap = resourceMap;

  pushDispatcher(Dispatcher);
}

export function cleanupAfterRender() {
  currentResourceMap = null;

  popDispatcher();
}

function preinitStylesheet(props: Object): Resource {
  if (currentResourceMap === null) {
    // @TODO excluding these errors since these methods are not exported (yet) and the error logic is going to evolve
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      `${'preinitStylesheet'} was called while currentResourceMap is null. this is a bug in React`,
    );
  }

  const key = getResourceKeyFromTypeAndProps('link', props);
  if (!key) {
    throw new Error(
      `${'preinitStylesheet'} was called with props that are not valid for a Resource. This is a bug in React.`,
    );
  }
  let resource = currentResourceMap.get(key);
  if (resource) {
    if (resource.priority < PREINIT) {
      // We are upgrading a lower priority resource to this priority. replace props without
      // validating differences
      resource.priority = PREINIT;
      resource.flushed = false;
      resource.props = props;
      resource.chunks = [];
    } else {
      // @TODO validate prop differences
      validateResourceAndProps(resource, props);
    }
  } else {
    resource = {
      flushed: false,
      priority: PREINIT,
      type: STYLE_RESOURCE,
      elementType: 'link',
      key,
      props,
      chunks: [],
    };
    currentResourceMap.set(key, resource);
  }
  return resource;
}

// Construct a resource from link props.
// Returns true if the link was fully described by the resource and the link can omitted from the stream.
// Returns false if the link should still be emitted to the stream
export function resourceFromLink(props: Object): ?Resource {
  const rel = props.rel;
  const href = props.href;
  if (typeof rel !== 'string' || typeof href !== 'string') {
    return;
  }

  switch (rel) {
    case 'stylesheet': {
      if (validateResourceProps(props)) {
        return preinitStylesheet(props);
      }
      return null;
    }
    default:
      return null;
  }
}

// returns false if props object contains any props which invalidate
// treating the element entirely as a Resource
function validateResourceProps(props: Object): boolean {
  for (const prop in props) {
    if (prop.toLowerCase().startsWith('data-')) {
      return false;
    }
  }
  return true;
}

function getResourceKeyFromTypeAndProps(
  type: ResourceElementType,
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

function validateResourceAndProps(resource: Resource, props: Object) {
  if (__DEV__) {
    switch (resource.type) {
      case STYLE_RESOURCE: {
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
              'created',
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

const Dispatcher = {};
