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
let Scheduler;

describe('ReactTestRendererAsync', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');
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
    expect(Scheduler).toFlushWithoutYielding();
    expect(renderer.toJSON()).toEqual('Hi');

    // Update
    renderer.update(<Foo>Bye</Foo>);
    // Not yet updated.
    expect(renderer.toJSON()).toEqual('Hi');
    // Flush update.
    expect(Scheduler).toFlushWithoutYielding();
    expect(renderer.toJSON()).toEqual('Bye');
  });

  it('flushAll returns array of yielded values', () => {
    function Child(props) {
      Scheduler.unstable_yieldValue(props.children);
      return props.children;
    }
    function Parent(props) {
      return (
        <>
          <Child>{'A:' + props.step}</Child>
          <Child>{'B:' + props.step}</Child>
          <Child>{'C:' + props.step}</Child>
        </>
      );
    }
    const renderer = ReactTestRenderer.create(<Parent step={1} />, {
      unstable_isConcurrent: true,
    });

    expect(Scheduler).toFlushAndYield(['A:1', 'B:1', 'C:1']);
    expect(renderer.toJSON()).toEqual(['A:1', 'B:1', 'C:1']);

    renderer.update(<Parent step={2} />);
    expect(Scheduler).toFlushAndYield(['A:2', 'B:2', 'C:2']);
    expect(renderer.toJSON()).toEqual(['A:2', 'B:2', 'C:2']);
  });

  it('flushThrough flushes until the expected values is yielded', () => {
    function Child(props) {
      Scheduler.unstable_yieldValue(props.children);
      return props.children;
    }
    function Parent(props) {
      return (
        <>
          <Child>{'A:' + props.step}</Child>
          <Child>{'B:' + props.step}</Child>
          <Child>{'C:' + props.step}</Child>
        </>
      );
    }
    const renderer = ReactTestRenderer.create(<Parent step={1} />, {
      unstable_isConcurrent: true,
    });

    // Flush the first two siblings
    expect(Scheduler).toFlushAndYieldThrough(['A:1', 'B:1']);
    // Did not commit yet.
    expect(renderer.toJSON()).toEqual(null);

    // Flush the remaining work
    expect(Scheduler).toFlushAndYield(['C:1']);
    expect(renderer.toJSON()).toEqual(['A:1', 'B:1', 'C:1']);
  });

  it('supports high priority interruptions', () => {
    function Child(props) {
      Scheduler.unstable_yieldValue(props.children);
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
          <>
            <Child>{'A:' + this.props.step}</Child>
            <Child>{'B:' + this.props.step}</Child>
          </>
        );
      }
    }

    const renderer = ReactTestRenderer.create(<Example step={1} />, {
      unstable_isConcurrent: true,
    });

    // Flush the some of the changes, but don't commit
    expect(Scheduler).toFlushAndYieldThrough(['A:1']);
    expect(renderer.toJSON()).toEqual(null);

    // Interrupt with higher priority properties
    renderer.unstable_flushSync(() => {
      renderer.update(<Example step={2} />);
    });

    // Only the higher priority properties have been committed
    expect(renderer.toJSON()).toEqual(['A:2', 'B:2']);
  });

  describe('Jest matchers', () => {
    it('toFlushAndYieldThrough', () => {
      const Yield = ({id}) => {
        Scheduler.unstable_yieldValue(id);
        return id;
      };

      ReactTestRenderer.create(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>,
        {
          unstable_isConcurrent: true,
        },
      );

      expect(() =>
        expect(Scheduler).toFlushAndYieldThrough(['foo', 'baz']),
      ).toThrow('// deep equality');
    });

    it('toFlushAndYield', () => {
      const Yield = ({id}) => {
        Scheduler.unstable_yieldValue(id);
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

      expect(() => expect(Scheduler).toFlushWithoutYielding()).toThrowError(
        '// deep equality',
      );

      renderer.update(
        <div>
          <Yield id="foo" />
          <Yield id="bar" />
          <Yield id="baz" />
        </div>,
      );

      expect(() => expect(Scheduler).toFlushAndYield(['foo', 'baz'])).toThrow(
        '// deep equality',
      );
    });

    it('toFlushAndThrow', () => {
      const Yield = ({id}) => {
        Scheduler.unstable_yieldValue(id);
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

      expect(Scheduler).toFlushAndThrow('Oh no!');
      expect(Scheduler).toHaveYielded(['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D']);

      renderer.update(<App />);

      expect(Scheduler).toFlushAndThrow('Oh no!');
      expect(Scheduler).toHaveYielded(['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D']);

      renderer.update(<App />);
      expect(Scheduler).toFlushAndThrow('Oh no!');
    });
  });

  it('toHaveYielded', () => {
    const Yield = ({id}) => {
      Scheduler.unstable_yieldValue(id);
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
    expect(() => expect(Scheduler).toHaveYielded(['A', 'B'])).toThrow(
      '// deep equality',
    );
  });

  it('flush methods throw if log is not empty', () => {
    ReactTestRenderer.create(<div />, {
      unstable_isConcurrent: true,
    });
    Scheduler.unstable_yieldValue('Something');
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toThrow(
      'Log of yielded values is not empty.',
    );
  });
});
