/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
      unstable_isConcurrent: true,
    });

    // Before flushing, nothing has mounted.
    expect(renderer.toJSON()).toEqual(null);

    // Flush initial mount.
    expect(renderer).toFlushAll([]);
    expect(renderer.toJSON()).toEqual('Hi');

    // Update
    renderer.update(<Foo>Bye</Foo>);
    // Not yet updated.
    expect(renderer.toJSON()).toEqual('Hi');
    // Flush update.
    expect(renderer).toFlushAll([]);
    expect(renderer.toJSON()).toEqual('Bye');
  });

  it('flushAll returns array of yielded values', () => {
    function Child(props) {
      ReactTestRenderer.unstable_yield(props.children);
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
      unstable_isConcurrent: true,
    });

    expect(renderer).toFlushAll(['A:1', 'B:1', 'C:1']);
    expect(renderer.toJSON()).toEqual(['A:1', 'B:1', 'C:1']);

    renderer.update(<Parent step={2} />);
    expect(renderer).toFlushAll(['A:2', 'B:2', 'C:2']);
    expect(renderer.toJSON()).toEqual(['A:2', 'B:2', 'C:2']);
  });

  it('flushThrough flushes until the expected values is yielded', () => {
    function Child(props) {
      ReactTestRenderer.unstable_yield(props.children);
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
      unstable_isConcurrent: true,
    });

    // Flush the first two siblings
    expect(renderer).toFlushThrough(['A:1', 'B:1']);
    // Did not commit yet.
    expect(renderer.toJSON()).toEqual(null);

    // Flush the remaining work
    expect(renderer).toFlushAll(['C:1']);
    expect(renderer.toJSON()).toEqual(['A:1', 'B:1', 'C:1']);
  });

  it('supports high priority interruptions', () => {
    function Child(props) {
      ReactTestRenderer.unstable_yield(props.children);
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
      unstable_isConcurrent: true,
    });

    // Flush the some of the changes, but don't commit
    expect(renderer).toFlushThrough(['A:1']);
    expect(renderer.toJSON()).toEqual(null);

    // Interrupt with higher priority properties
    renderer.unstable_flushSync(() => {
      renderer.update(<Example step={2} />);
    });

    // Only the higher priority properties have been committed
    expect(renderer.toJSON()).toEqual(['A:2', 'B:2']);
  });

  describe('Jest matchers', () => {
    it('toFlushThrough', () => {
      const Yield = ({id}) => {
        ReactTestRenderer.unstable_yield(id);
        return id;
      };

      const renderer = ReactTestRenderer.create(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>,
        {
          unstable_isConcurrent: true,
        },
      );

      expect(() => expect(renderer).toFlushThrough(['foo', 'baz'])).toThrow(
        'Expected value to equal:',
      );
    });

    it('toFlushAll', () => {
      const Yield = ({id}) => {
        ReactTestRenderer.unstable_yield(id);
        return id;
      };

      const renderer = ReactTestRenderer.create(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>,
        {
          unstable_isConcurrent: true,
        },
      );

      expect(() => expect(renderer).toFlushAll([])).toThrowError(
        'Expected value to equal:',
      );

      renderer.update(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>,
      );

      expect(() => expect(renderer).toFlushAll(['foo', 'baz'])).toThrow(
        'Expected value to equal:',
      );
    });

    it('toFlushAndThrow', () => {
      const Yield = ({id}) => {
        ReactTestRenderer.unstable_yield(id);
        return id;
      };

      function BadRender() {
        throw new Error('Oh no!');
      }

      function App() {
        return (
          <div>
            <Yield id="A" />
            <Yield id="B" />
            <BadRender />
            <Yield id="C" />
            <Yield id="D" />
          </div>
        );
      }

      const renderer = ReactTestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      });

      expect(() => {
        expect(renderer).toFlushAndThrow(
          // Wrong expected values
          ['A', 'B'],
          'Oh no!',
        );
      }).toThrow('Expected value to equal:');

      renderer.update(<App />);

      expect(() => {
        expect(renderer).toFlushAndThrow(
          ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'],
          // Wrong error message
          'Oops!',
        );
      }).toThrow('Expected the function to throw an error matching:');

      renderer.update(<App />);

      // Passes
      expect(renderer).toFlushAndThrow(
        ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'],
        'Oh no!',
      );
    });
  });

  it('toClearYields', () => {
    const Yield = ({id}) => {
      ReactTestRenderer.unstable_yield(id);
      return id;
    };

    function App() {
      return (
        <div>
          <Yield id="A" />
          <Yield id="B" />
          <Yield id="C" />
        </div>
      );
    }

    ReactTestRenderer.create(<App />);
    expect(() => expect(ReactTestRenderer).toClearYields(['A', 'B'])).toThrow(
      'Expected value to equal:',
    );
  });
});
