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

describe('ReactIncrementalReflection', () => {
  beforeEach(() => {
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  it('handles isMounted even when the initial render is deferred', () => {

    let ops = [];

    const instances = [];

    const Component = React.createClass({
      componentWillMount() {
        instances.push(this);
        ops.push('componentWillMount', this.isMounted());
      },
      componentDidMount() {
        ops.push('componentDidMount', this.isMounted());
      },
      render() {
        return <span />;
      },
    });

    function Foo() {
      return <Component />;
    }

    ReactNoop.render(<Foo />);

    // Render part way through but don't yet commit the updates.
    ReactNoop.flushDeferredPri(20);

    expect(ops).toEqual([
      'componentWillMount', false,
    ]);

    expect(instances[0].isMounted()).toBe(false);

    ops = [];

    // Render the rest and commit the updates.
    ReactNoop.flush();

    expect(ops).toEqual([
      'componentDidMount', true,
    ]);

    expect(instances[0].isMounted()).toBe(true);

  });

  it('handles isMounted when an unmount is deferred', () => {

    let ops = [];

    const instances = [];

    const Component = React.createClass({
      componentWillMount() {
        instances.push(this);
      },
      componentWillUnmount() {
        ops.push('componentWillUnmount', this.isMounted());
      },
      render() {
        ops.push('Component');
        return <span />;
      },
    });

    function Other() {
      ops.push('Other');
      return <span />;
    }

    function Foo(props) {
      return props.mount ? <Component /> : <Other />;
    }

    ReactNoop.render(<Foo mount={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Component']);
    ops = [];

    expect(instances[0].isMounted()).toBe(true);

    ReactNoop.render(<Foo mount={false} />);
    // Render part way through but don't yet commit the updates so it is not
    // fully unmounted yet.
    ReactNoop.flushDeferredPri(20);

    expect(ops).toEqual(['Other']);
    ops = [];

    expect(instances[0].isMounted()).toBe(true);

    // Finish flushing the unmount.
    ReactNoop.flush();

    expect(ops).toEqual([
      'componentWillUnmount', true,
    ]);

    expect(instances[0].isMounted()).toBe(false);

  });

});
