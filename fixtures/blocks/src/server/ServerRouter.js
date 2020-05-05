/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

function tryMatch(template, url) {
  const templateSegments = template.split('/').filter(Boolean);
  const urlSegments = url.split('/').filter(Boolean);
  let nextParams = {};
  while (urlSegments.length > 0) {
    if (templateSegments.length === 0) {
      return null;
    }
    const urlSegment = urlSegments.shift();
    const templateSegment = templateSegments.shift();
    if (urlSegment === templateSegment) {
      continue;
    }
    if (templateSegment[0] === ':') {
      nextParams[templateSegment.slice(1)] = urlSegment;
      continue;
    }
    if (templateSegment === '*') {
      nextParams.route = '/' + urlSegment + urlSegments.join('/');
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

export function matchRoute(url, routes) {
  let Block;
  for (let route of routes) {
    const [template, load, ...restArgs] = route;
    const nextParams = tryMatch(template, url);
    if (nextParams) {
      Block = load(nextParams, ...restArgs);
      break;
    }
  }
  if (!Block) {
    throw Error('Not found.');
  }
  return Block;
}
