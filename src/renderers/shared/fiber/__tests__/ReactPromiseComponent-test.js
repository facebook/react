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

  it('blocks work at the same or lower priority from committing until promise resolves', () => {
    function Foo(props) {
      return <span prop="Hi" />;
    }
    const PromiseForFoo = Promise.resolve(Foo);

    function Bar() {
      return <span prop="Yo" />;
    }

    function Parent() {
      return [
        <PromiseForFoo />,
        <Bar />,
      ];
    }

    ReactNoop.render(<Parent />);
    ReactNoop.flush();
    // Promise has not resolved yet. All work in the tree is blocked.
    expect(ReactNoop.getChildren()).toEqual([]);

    return PromiseForFoo.then(() => {
      ReactNoop.flush();
      // The promise has resolved. The tree is no longer blocked.
      expect(ReactNoop.getChildren()).toEqual([
        span('Hi'),
        span('Yo'),
      ]);
    });
  });

  it('does not block higher-priority work from committing', () => {
    function Foo(props) {
      return <span prop="Hi" />;
    }
    const PromiseForFoo = Promise.resolve(Foo);

    let instance;
    class Bar extends React.Component {
      state = { step: 1 };
      render() {
        instance = this;
        return <span prop={'step: ' + this.state.step} />;
      }
    }

    function Parent() {
      return [
        <PromiseForFoo />,
        <Bar />,
      ];
    }

    ReactNoop.render(<Parent />);
    ReactNoop.flush();
    // Promise has not resolved yet. All work in the tree is blocked.
    expect(ReactNoop.getChildren()).toEqual([]);

    ReactNoop.performAnimationWork(() => {
      instance.setState({ step: 2 });
    });
    ReactNoop.flush();
    // We performed a high priority update, which unblocks the tree.
    expect(ReactNoop.getChildren()).toEqual([span('step: 2')]);

    instance.setState({ step: 3 });
    ReactNoop.flush();
    // Low pri updates are still blocked.
    expect(ReactNoop.getChildren()).toEqual([span('step: 2')]);

    return PromiseForFoo.then(() => {
      ReactNoop.flush();
      // The promise has resolved. The tree is no longer blocked.
      expect(ReactNoop.getChildren()).toEqual([
        span('Hi'),
        span('step: 3'),
      ]);
    });
  });
});
