/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

function tryMatch(props, def) {
  const defSegments = def.split('/').filter(Boolean);
  const routeSegments = props.route.split('/').filter(Boolean);
  let innerProps = {...props};
  while (routeSegments.length > 0) {
    if (defSegments.length === 0) {
      return null;
    }
    const urlSegment = routeSegments.shift();
    const defSegment = defSegments.shift();
    if (urlSegment === defSegment) {
      continue;
    }
    if (defSegment[0] === ':') {
      innerProps[defSegment.slice(1)] = urlSegment;
      continue;
    }
    if (defSegment === '*') {
      innerProps.route = '/' + urlSegment + routeSegments.join('/');
      return innerProps;
    }
    return null;
  }
  if (defSegments.length === 0) {
    return innerProps;
  }
  if (defSegments.length === 1 && defSegments[0] === '*') {
    innerProps.route = '/';
    return innerProps;
  }
  return null;
}

export function matchRoute(props, defs) {
  for (let def in defs) {
    if (!defs.hasOwnProperty(def)) {
      continue;
    }
    const innerProps = tryMatch(props, def);
    if (innerProps) {
      const match = defs[def](innerProps);
      return match;
    }
  }
  throw Error('Not found.');
}
