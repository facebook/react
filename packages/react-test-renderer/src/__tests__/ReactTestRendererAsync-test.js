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

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');

describe('ReactTestRendererAsync', () => {
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
});
