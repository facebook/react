/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
