/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactVersion from 'shared/ReactVersion';

import {
  renderToString,
  renderToStaticMarkup,
  renderToStringNonStandard,
  renderToStaticMarkupNonStandard,
} from './ReactDOMStringRenderer';
import {
  renderToNodeStream,
  renderToStaticNodeStream,
  renderToNodeStreamNonStandard,
  renderToStaticNodeStreamNonStandard,
} from './ReactDOMNodeStreamRenderer';

// Note: when changing this, also consider https://github.com/facebook/react/issues/11526
export default {
  renderToString,
  renderToStaticMarkup,
  renderToStringNonStandard,
  renderToStaticMarkupNonStandard,
  renderToNodeStream,
  renderToStaticNodeStream,
  renderToNodeStreamNonStandard,
  renderToStaticNodeStreamNonStandard,
  version: ReactVersion,
};
