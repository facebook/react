/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

function tryMatch(template, params) {
  const templateSegments = template.split('/').filter(Boolean);
  const routeSegments = params.route.split('/').filter(Boolean);
  let nextParams = {...params};
  while (routeSegments.length > 0) {
    if (templateSegments.length === 0) {
      return null;
    }
    const urlSegment = routeSegments.shift();
    const templateSegment = templateSegments.shift();
    if (urlSegment === templateSegment) {
      continue;
    }
    if (templateSegment[0] === ':') {
      nextParams[templateSegment.slice(1)] = urlSegment;
      continue;
    }
    if (templateSegment === '*') {
      nextParams.route = '/' + urlSegment + routeSegments.join('/');
      return nextParams;
    }
    return null;
  }
  if (templateSegments.length === 0) {
    return nextParams;
  }
  if (templateSegments.length === 1 && templateSegments[0] === '*') {
    nextParams.route = '/';
    return nextParams;
  }
  return null;
}

export function matchRoute(params, routes) {
  let Block;
  for (let route of routes) {
    const [template, load] = route;
    const nextParams = tryMatch(template, params);
    if (nextParams) {
      Block = load(nextParams);
      break;
    }
  }
  if (!Block) {
    throw Error('Not found.');
  }
  return Block;
}
