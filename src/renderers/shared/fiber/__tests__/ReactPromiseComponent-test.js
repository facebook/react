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

describe('ReactPromiseComponent', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  function div(...children) {
    children = children.map(c => typeof c === 'string' ? { text: c } : c);
    return { type: 'div', children, prop: undefined };
  }

  function span(prop) {
    return { type: 'span', children: [], prop };
  }

  it('supports promise as element type', () => {
    const PromiseForDiv = Promise.resolve('div');
    ReactNoop.render(<PromiseForDiv><span prop="Hi" /></PromiseForDiv>);
    ReactNoop.flush();
    // Promise has not resolved yet
    expect(ReactNoop.getChildren()).toEqual([]);

    return PromiseForDiv.then(() => {
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([
        div(span('Hi')),
      ]);
    });
  });

  it('can update a promise component with new props', () => {
    function Foo(props) {
      return <span prop={props.step} />;
    }
    const PromiseForFoo = Promise.resolve(Foo);
    ReactNoop.render(<PromiseForFoo step={1} />);
    ReactNoop.flush();
    // Promise has not resolved yet
    expect(ReactNoop.getChildren()).toEqual([]);

    return PromiseForFoo.then(() => {
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span(1)]);

      ReactNoop.render(<PromiseForFoo step={2} />);
      ReactNoop.flush();
      // Should not have bailed out because the promise already resolved.
      expect(ReactNoop.getChildren()).toEqual([span(2)]);
    });
  });
});
