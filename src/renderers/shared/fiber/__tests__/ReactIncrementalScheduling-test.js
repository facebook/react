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

var React;
var ReactNoop;

describe('ReactIncrementalScheduling', () => {
  beforeEach(() => {
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('schedules multiple roots', () => {
    // Schedule one root
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);

    // Schedule two roots
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
    // First scheduled one gets processed first
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([]);
    expect(ReactNoop.getChildren('c')).toEqual(null);
    // Then the second one gets processed
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual(null);

    // Schedule three roots
    ReactNoop.renderToRootWithID(<span prop="a:3" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:3" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:3" />, 'c');
    // They get processed in the order they were scheduled
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:3')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:3')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:3')]);

    // Schedule one root many times
    ReactNoop.renderToRootWithID(<span prop="a:4" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="a:5" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="a:6" />, 'a');
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:6')]);
  });

  it('works on roots with animation priority before deferred work', () => {
    ReactNoop.renderToRootWithID(<span prop="a:1" />, 'a');
    ReactNoop.renderToRootWithID(<span prop="b:1" />, 'b');
    ReactNoop.renderToRootWithID(<span prop="c:1" />, 'c');
    ReactNoop.flush();
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:1')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);

    // Schedule both deferred and animation work
    ReactNoop.renderToRootWithID(<span prop="a:2" />, 'a');
    ReactNoop.performAnimationWork(() => {
      ReactNoop.renderToRootWithID(<span prop="b:2" />, 'b');
      ReactNoop.renderToRootWithID(<span prop="c:2" />, 'c');
    });
    // Handle roots with animation work first
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:1')]);
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:1')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
    // Then handle deferred root
    ReactNoop.flushDeferredPri(15);
    expect(ReactNoop.getChildren('a')).toEqual([span('a:2')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('b:2')]);
    expect(ReactNoop.getChildren('c')).toEqual([span('c:2')]);
  });
});
