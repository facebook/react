/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

let React;
let ReactNoop;

describe('ReactFragment', () => {
  beforeEach(function() {
    jest.resetModules();

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableReactFragment = true;

    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function text(val) {
    return {text: val};
  }

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  it('should render a single child via noop renderer', () => {
    const element = (
      <React.Fragment>
        <span>foo</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([span()]);
  });

  it('should render zero children via noop renderer', () => {
    const element = <React.Fragment />;

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('should render multiple children via noop renderer', () => {
    const element = (
      <React.Fragment>
        hello <span>world</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([text('hello '), span()]);
  });

  it('should render an iterable via noop renderer', () => {
    const element = (
      <React.Fragment>
        {new Set([<span key="a">hi</span>, <span key="b">bye</span>])}
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([span(), span()]);
  });

  it('should preserve state of children with 1 level nesting', function() {
    var ops = [];

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
        <React.Fragment>
          <Stateful key="a" />
          <div key="b">World</div>
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between top-level fragments', function() {
    var ops = [];

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
        <React.Fragment>
          <Stateful />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Stateful />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state of children nested at same level', function() {
    var ops = [];

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
        <React.Fragment>
          <React.Fragment>
            <React.Fragment>
              <Stateful key="a" />
            </React.Fragment>
          </React.Fragment>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <React.Fragment>
            <React.Fragment>
              <div />
              <Stateful key="a" />
            </React.Fragment>
          </React.Fragment>
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state in non-top-level fragment nesting', function() {
    var ops = [];

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
        <React.Fragment>
          <React.Fragment>
            <Stateful key="a" />
          </React.Fragment>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Stateful key="a" />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state of children if nested 2 levels without siblings', function() {
    var ops = [];

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
        <React.Fragment>
          <React.Fragment>
            <Stateful key="a" />
          </React.Fragment>
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state of children if nested 2 levels with siblings', function() {
    var ops = [];

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
        <React.Fragment>
          <React.Fragment>
            <Stateful key="a" />
          </React.Fragment>
          <div />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between array nested in fragment and fragment', function() {
    var ops = [];

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
        <React.Fragment>
          <Stateful key="a" />
        </React.Fragment>
      ) : (
        <React.Fragment>{[<Stateful key="a" />]}</React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between top level fragment and array', function() {
    var ops = [];

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
        <React.Fragment>
          <Stateful key="a" />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state between array nested in fragment and double nested fragment', function() {
    var ops = [];

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
        <React.Fragment>{[<Stateful key="a" />]}</React.Fragment>
      ) : (
        <React.Fragment>
          <React.Fragment>
            <Stateful key="a" />
          </React.Fragment>
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state between array nested in fragment and double nested array', function() {
    var ops = [];

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
        <React.Fragment>{[<Stateful key="a" />]}</React.Fragment>
      ) : (
        [[<Stateful key="a" />]]
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state between double nested fragment and double nested array', function() {
    var ops = [];

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
        <React.Fragment>
          <React.Fragment>
            <Stateful key="a" />
          </React.Fragment>
        </React.Fragment>
      ) : (
        [[<Stateful key="a" />]]
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state of children when the keys are different', function() {
    var ops = [];

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
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(), span()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should not preserve state between unkeyed and keyed fragment', function() {
    var ops = [];

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
        <React.Fragment>
          <Stateful />
        </React.Fragment>
      );
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div()]);
  });

  it('should preserve state with reordering in multiple levels', function() {
    var ops = [];

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
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(span(), div(div()), span())]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([div(span(), div(div()), span())]);
  });

  it('should not preserve state when switching to a keyed fragment to an array', function() {
    spyOnDev(console, 'error');
    var ops = [];

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
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(div(), span())]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(div(), span())]);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Each child in an array or iterator should have a unique "key" prop.',
      );
    }
  });

  it('should preserve state when it does not change positions', function() {
    spyOnDev(console, 'error');
    var ops = [];

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
            <React.Fragment>
              <Stateful />
            </React.Fragment>,
          ]
        : [
            <span />,
            <React.Fragment>
              <Stateful />
            </React.Fragment>,
          ];
    }

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([span(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([span(), div()]);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(3);
      for (let errorIndex = 0; errorIndex < 3; ++errorIndex) {
        expect(console.error.calls.argsFor(errorIndex)[0]).toContain(
          'Each child in an array or iterator should have a unique "key" prop.',
        );
      }
    }
  });
});
