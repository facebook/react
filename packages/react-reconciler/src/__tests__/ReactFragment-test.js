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
let ReactNoop;
let Scheduler;

describe('ReactFragment', () => {
  beforeEach(function() {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function div(...children) {
    children = children.map(c =>
      typeof c === 'string' ? {text: c, hidden: false} : c,
    );
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function text(t) {
    return {text: t, hidden: false};
  }

  it('should render a single child via noop renderer', () => {
    const element = (
      <>
        <span>foo</span>
      </>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ReactNoop.getChildren()).toEqual([span()]);
  });

  it('should render zero children via noop renderer', () => {
    const element = <React.Fragment />;

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('should render multiple children via noop renderer', () => {
    const element = (
      <>
        hello <span>world</span>
      </>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ReactNoop.getChildren()).toEqual([text('hello '), span()]);
  });

  it('should render an iterable via noop renderer', () => {
    const element = (
      <>{new Set([<span key="a">hi</span>, <span key="b">bye</span>])}</>
    );

    ReactNoop.render(element);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ReactNoop.getChildren()).toEqual([span(), span()]);
  });

  it('should preserve state of children with 1 level nesting', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        <>
          <Stateful key="a" />
          <div key="b">World</div>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between top-level fragments', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <Stateful />
        </>
      ) : (
        <>
          <Stateful />
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state of children nested at same level', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <>
            <>
              <Stateful key="a" />
            </>
          </>
        </>
      ) : (
        <>
          <>
            <>
              <div />
              <Stateful key="a" />
            </>
          </>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state in non-top-level fragment nesting', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <>
            <Stateful key="a" />
          </>
        </>
      ) : (
        <>
          <Stateful key="a" />
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state of children if nested 2 levels without siblings', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        <>
          <>
            <Stateful key="a" />
          </>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state of children if nested 2 levels with siblings', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        <>
          <>
            <Stateful key="a" />
          </>
          <div />
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between array nested in fragment and fragment', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <Stateful key="a" />
        </>
      ) : (
        <>{[<Stateful key="a" />]}</>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between top level fragment and array', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        [<Stateful key="a" />]
      ) : (
        <>
          <Stateful key="a" />
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state between array nested in fragment and double nested fragment', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>{[<Stateful key="a" />]}</>
      ) : (
        <>
          <>
            <Stateful key="a" />
          </>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state between array nested in fragment and double nested array', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>{[<Stateful key="a" />]}</>
      ) : (
        [[<Stateful key="a" />]]
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between double nested fragment and double nested array', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <>
            <Stateful key="a" />
          </>
        </>
      ) : (
        [[<Stateful key="a" />]]
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state of children when the keys are different', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <React.Fragment key="a">
          <Stateful />
        </React.Fragment>
      ) : (
        <React.Fragment key="b">
          <Stateful />
          <span>World</span>
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(), span()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state between unkeyed and keyed fragment', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <React.Fragment key="a">
          <Stateful />
        </React.Fragment>
      ) : (
        <>
          <Stateful />
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state with reordering in multiple levels', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <div>
          <React.Fragment key="c">
            <span>foo</span>
            <div key="b">
              <Stateful key="a" />
            </div>
          </React.Fragment>
          <span>boop</span>
        </div>
      ) : (
        <div>
          <span>beep</span>
          <React.Fragment key="c">
            <div key="b">
              <Stateful key="a" />
            </div>
            <span>bar</span>
          </React.Fragment>
        </div>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(span(), div(div()), span())]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(span(), div(div()), span())]);
  });

  it('should not preserve state when switching to a keyed fragment to an array', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <div>
          {
            <React.Fragment key="foo">
              <Stateful />
            </React.Fragment>
          }
          <span />
        </div>
      ) : (
        <div>
          {[<Stateful />]}
          <span />
        </div>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev(
      'Each child in a list should have a unique "key" prop.',
    );

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(div(), span())]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(div(), span())]);
  });

  it('should not preserve state when switching a nested unkeyed fragment to a passthrough component', function() {
    const ops = [];

    function Passthrough({children}) {
      return children;
    }

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <>
            <Stateful />
          </>
        </>
      ) : (
        <>
          <Passthrough>
            <Stateful />
          </Passthrough>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state when switching a nested keyed fragment to a passthrough component', function() {
    const ops = [];

    function Passthrough({children}) {
      return children;
    }

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>
          <React.Fragment key="a">
            <Stateful />
          </React.Fragment>
        </>
      ) : (
        <>
          <Passthrough>
            <Stateful />
          </Passthrough>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state when switching a nested keyed array to a passthrough component', function() {
    const ops = [];

    function Passthrough({children}) {
      return children;
    }

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition ? (
        <>{[<Stateful key="a" />]}</>
      ) : (
        <>
          <Passthrough>
            <Stateful />
          </Passthrough>
        </>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    ReactNoop.render(<Foo condition={false} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state when it does not change positions', function() {
    const ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Foo({condition}) {
      return condition
        ? [
            <span />,
            <>
              <Stateful />
            </>,
          ]
        : [
            <span />,
            <>
              <Stateful />
            </>,
          ];
    }

    ReactNoop.render(<Foo condition={true} />);
    expect(() => expect(Scheduler).toFlushWithoutYielding()).toErrorDev(
      'Each child in a list should have a unique "key" prop.',
    );

    ReactNoop.render(<Foo condition={false} />);
    // The key warning gets deduped because it's in the same component.
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([span(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    // The key warning gets deduped because it's in the same component.
    expect(Scheduler).toFlushWithoutYielding();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([span(), div()]);
  });
});
