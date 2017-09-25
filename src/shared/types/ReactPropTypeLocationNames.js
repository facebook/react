/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule ReactPropTypeLocationNames
 */

'use strict';

import type {ReactPropTypeLocations} from 'ReactPropTypeLocations';

type NamesType = {[key: ReactPropTypeLocations]: string};

var ReactPropTypeLocationNames: NamesType = {};

if (__DEV__) {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context',
  };
}

module.exports = ReactPropTypeLocationNames;
