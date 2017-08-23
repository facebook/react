/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServerNodeEntry
 */

'use strict';

import 'ReactDOMInjection';
import {renderToString, renderToStaticMarkup} from 'ReactDOMStringRenderer';
import {
  renderToNodeStream,
  renderToStaticNodeStream,
} from 'ReactDOMNodeStreamRenderer';
import ReactVersion from 'ReactVersion';

// TODO: convert to ESM?
module.exports = {
  renderToString,
  renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream,
  version: ReactVersion,
};
