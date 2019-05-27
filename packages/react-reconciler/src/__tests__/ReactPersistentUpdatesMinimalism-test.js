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
let ReactNoopPersistent;

describe('ReactPersistentUpdatesMinimalism', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoopPersistent = require('react-noop-renderer/persistent');
  });

  it('should render a simple component', () => {
    function Child() {
      return <div>Hello World</div>;
    }

    function Parent() {
      return <Child />;
    }

    ReactNoopPersistent.render(<Parent />);
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      hostDiffCounter: 0,
      hostCloneCounter: 0,
    });

    ReactNoopPersistent.render(<Parent />);
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      hostDiffCounter: 1,
      hostCloneCounter: 1,
    });
  });

  it('should not diff referentially equal host elements', () => {
    function Leaf(props) {
      return (
        <span>
          hello
          <b />
          {props.name}
        </span>
      );
    }

    const constEl = (
      <div>
        <Leaf name="world" />
      </div>
    );

    function Child() {
      return constEl;
    }

    function Parent() {
      return <Child />;
    }

    ReactNoopPersistent.render(<Parent />);
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      hostDiffCounter: 0,
      hostCloneCounter: 0,
    });

    ReactNoopPersistent.render(<Parent />);
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      hostDiffCounter: 0,
      hostCloneCounter: 0,
    });
  });

  it('should not diff parents of setState targets', () => {
    let childInst;

    function Leaf(props) {
      return (
        <span>
          hello
          <b />
          {props.name}
        </span>
      );
    }

    class Child extends React.Component {
      state = {name: 'Batman'};
      render() {
        childInst = this;
        return (
          <div>
            <Leaf name={this.state.name} />
          </div>
        );
      }
    }

    function Parent() {
      return (
        <section>
          <div>
            <Leaf name="world" />
            <Child />
            <hr />
            <Leaf name="world" />
          </div>
        </section>
      );
    }

    ReactNoopPersistent.render(<Parent />);
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      hostDiffCounter: 0,
      hostCloneCounter: 0,
    });

    childInst.setState({name: 'Robin'});
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      // section > div > Child > div
      // section > div > Child > Leaf > span
      // section > div > Child > Leaf > span > b
      hostDiffCounter: 3,
      // section
      // section > div
      // section > div > Child > div
      // section > div > Child > Leaf > span
      // section > div > Child > Leaf > span > b
      hostCloneCounter: 5,
    });

    ReactNoopPersistent.render(<Parent />);
    expect(ReactNoopPersistent.flushWithHostCounters()).toEqual({
      // Parent > section
      // Parent > section > div
      // Parent > section > div > Leaf > span
      // Parent > section > div > Leaf > span > b
      // Parent > section > div > Child > div
      // Parent > section > div > Child > div > Leaf > span
      // Parent > section > div > Child > div > Leaf > span > b
      // Parent > section > div > hr
      // Parent > section > div > Leaf > span
      // Parent > section > div > Leaf > span > b
      hostDiffCounter: 10,
      hostCloneCounter: 10,
    });
  });
});
