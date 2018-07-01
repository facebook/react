/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactTestRenderer;

describe('ReactTestRendererAsync', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
  });

  it('flushAll flushes all work', () => {
    function Foo(props) {
      return props.children;
    }
    const renderer = ReactTestRenderer.create(<Foo>Hi</Foo>, {
      unstable_isAsync: true,
    });

    // Before flushing, nothing has mounted.
    expect(renderer.toJSON()).toEqual(null);

    // Flush initial mount.
    renderer.unstable_flushAll();
    expect(renderer.toJSON()).toEqual('Hi');

    // Update
    renderer.update(<Foo>Bye</Foo>);
    // Not yet updated.
    expect(renderer.toJSON()).toEqual('Hi');
    // Flush update.
    renderer.unstable_flushAll();
    expect(renderer.toJSON()).toEqual('Bye');
  });

  it('flushAll returns array of yielded values', () => {
    function Child(props) {
      renderer.unstable_yield(props.children);
      return props.children;
    }
    function Parent(props) {
      return (
        <React.Fragment>
          <Child>{'A:' + props.step}</Child>
          <Child>{'B:' + props.step}</Child>
          <Child>{'C:' + props.step}</Child>
        </React.Fragment>
      );
    }
    const renderer = ReactTestRenderer.create(<Parent step={1} />, {
      unstable_isAsync: true,
    });

    expect(renderer.unstable_flushAll()).toEqual(['A:1', 'B:1', 'C:1']);
    expect(renderer.toJSON()).toEqual(['A:1', 'B:1', 'C:1']);

    renderer.update(<Parent step={2} />);
    expect(renderer.unstable_flushAll()).toEqual(['A:2', 'B:2', 'C:2']);
    expect(renderer.toJSON()).toEqual(['A:2', 'B:2', 'C:2']);
  });

  it('flushThrough flushes until the expected values is yielded', () => {
    function Child(props) {
      renderer.unstable_yield(props.children);
      return props.children;
    }
    function Parent(props) {
      return (
        <React.Fragment>
          <Child>{'A:' + props.step}</Child>
          <Child>{'B:' + props.step}</Child>
          <Child>{'C:' + props.step}</Child>
        </React.Fragment>
      );
    }
    const renderer = ReactTestRenderer.create(<Parent step={1} />, {
      unstable_isAsync: true,
    });

    // Flush the first two siblings
    expect(renderer.unstable_flushThrough(['A:1', 'B:1'])).toEqual([
      'A:1',
      'B:1',
    ]);
    // Did not commit yet.
    expect(renderer.toJSON()).toEqual(null);

    // Flush the remaining work
    expect(renderer.unstable_flushAll()).toEqual(['C:1']);
    expect(renderer.toJSON()).toEqual(['A:1', 'B:1', 'C:1']);
  });

  it('supports high priority interruptions', () => {
    function Child(props) {
      renderer.unstable_yield(props.children);
      return props.children;
    }

    class Example extends React.Component {
      componentDidMount() {
        expect(this.props.step).toEqual(2);
      }
      componentDidUpdate() {
        throw Error('Unexpected update');
      }
      render() {
        return (
          <React.Fragment>
            <Child>{'A:' + this.props.step}</Child>
            <Child>{'B:' + this.props.step}</Child>
          </React.Fragment>
        );
      }
    }

    const renderer = ReactTestRenderer.create(<Example step={1} />, {
      unstable_isAsync: true,
    });

    // Flush the some of the changes, but don't commit
    expect(renderer.unstable_flushThrough(['A:1'])).toEqual(['A:1']);
    expect(renderer.toJSON()).toEqual(null);

    // Interrupt with higher priority properties
    renderer.unstable_flushSync(() => {
      renderer.update(<Example step={2} />);
    });

    // Only the higher priority properties have been committed
    expect(renderer.toJSON()).toEqual(['A:2', 'B:2']);
  });

  it('should error if flushThrough params dont match yielded values', () => {
    const Yield = ({id}) => {
      renderer.unstable_yield(id);
      return id;
    };

    const renderer = ReactTestRenderer.create(
      <div>
        <Yield id="foo" />
        <Yield id="bar" />
        <Yield id="baz" />
      </div>,
      {
        unstable_isAsync: true,
      },
    );

    expect(() => renderer.unstable_flushThrough(['foo', 'baz'])).toThrow(
      'flushThrough expected to yield "baz", but "bar" was yielded',
    );
  });

  it('should error if flushThrough yields the wrong number of values', () => {
    const Yield = ({id}) => {
      renderer.unstable_yield(id);
      return id;
    };

    const renderer = ReactTestRenderer.create(
      <div>
        <Yield id="foo" />
      </div>,
      {
        unstable_isAsync: true,
      },
    );

    expect(() => renderer.unstable_flushThrough(['foo', 'bar'])).toThrow(
      'flushThrough expected to yield "bar", but nothing was yielded',
    );
  });

  it('should error if flushThrough yields no values', () => {
    const renderer = ReactTestRenderer.create(null, {
      unstable_isAsync: true,
    });

    expect(() => renderer.unstable_flushThrough(['foo'])).toThrow(
      'flushThrough expected to yield "foo", but nothing was yielded',
    );
  });
});
