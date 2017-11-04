/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import '../shared/ReactDOMInjection';
import ReactVersion from 'shared/ReactVersion';

import {renderToString, renderToStaticMarkup} from './ReactDOMStringRenderer';
import {
  renderToNodeStream,
  renderToStaticNodeStream,
} from './ReactDOMNodeStreamRenderer';

export {
  renderToString,
  renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream,
};

export const version = ReactVersion;
