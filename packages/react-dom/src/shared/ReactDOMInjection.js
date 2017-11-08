/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as DOMProperty from './DOMProperty';
import HTMLDOMPropertyConfig from './HTMLDOMPropertyConfig';
import SVGDOMPropertyConfig from './SVGDOMPropertyConfig';

DOMProperty.injection.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
DOMProperty.injection.injectDOMPropertyConfig(SVGDOMPropertyConfig);
