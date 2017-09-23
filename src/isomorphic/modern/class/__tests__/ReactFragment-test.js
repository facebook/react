/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */
'use strict';

const React = require('react');
const ReactNoop = require('react-noop-renderer');

const element = (
  <React.Fragment>
    hello <span>world</span>
  </React.Fragment>
);

describe('ReactFragment', () => {
  it('should render via noop renderer', () => {
    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([
      {text: 'hello '},
      {type: 'span', children: [], prop: undefined},
    ]);
  });
});
