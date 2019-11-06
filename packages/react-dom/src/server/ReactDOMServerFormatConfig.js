/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {convertStringToBuffer} from 'react-server/src/ReactServerHostConfig';

import ReactDOMServer from 'react-dom/server';

export function formatChunkAsString(type: string, props: Object): string {
  let str = '<' + type + '>';
  if (typeof props.children === 'string') {
    str += props.children;
  }
  str += '</' + type + '>';
  return str;
}

export function formatChunk(type: string, props: Object): Uint8Array {
  return convertStringToBuffer(formatChunkAsString(type, props));
}

export function renderHostChildrenToString(
  children: React$Element<any>,
): string {
  // TODO: This file is used to actually implement a server renderer
  // so we can't actually reference the renderer here. Instead, we
  // should replace this method with a reference to Fizz which
  // then uses this file to implement the server renderer.
  return ReactDOMServer.renderToStaticMarkup(children);
}
