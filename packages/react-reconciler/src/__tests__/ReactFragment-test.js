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
let Component;
let Fragment;
let ReactNoop;

describe('ReactFragment', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    Component = React.Component;
    Fragment = React.Fragment;
    ReactNoop = require('react-noop-renderer');
  });

  const span = prop => ({ type: 'span', children: [], prop });

  const text = (val) => ({ text: val });

  const div = (...children) => {
    children = children.map(c => (typeof c === 'string' ? { text: c } : c));
    return { type: 'div', children, prop: undefined };
  };

  it('should render a single child via noop renderer', () => {
    const element = (
      <Fragment>
        <span>foo</span>
      </Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([span()]);
  });

  it('should render zero children via noop renderer', () => {
    const element = <Fragment />;

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([]);
  });

  it('should render multiple children via noop renderer', () => {
    const element = (
      <Fragment>
        hello <span>world</span>
      </Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([text('hello '), span()]);
  });

  it('should render an iterable via noop renderer', () => {
    const element = (
      <Fragment>
        {new Set([<span key="a">hi</span>, <span key="b">bye</span>])}
      </Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([span(), span()]);
  });

  it('should preserve state of children with 1 level nesting', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({ condition }) =>
      condition ? (
        <Stateful key="a" />
      ) : (
        <Fragment>
          <Stateful key="a" />
          <div key="b">World</div>
        </Fragment>
      );

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

  it('should preserve state between top-level fragments', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          <Stateful />
        </Fragment>
      ) : (
        <Fragment>
          <Stateful />
        </Fragment>
      );

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

  it('should preserve state of children nested at same level', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          <Fragment>
            <Fragment>
              <Stateful key="a" />
            </Fragment>
          </Fragment>
        </Fragment>
      ) : (
        <Fragment>
          <Fragment>
            <Fragment>
              <div />
              <Stateful key="a" />
            </Fragment>
          </Fragment>
        </Fragment>
      );

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

  it('should not preserve state in non-top-level fragment nesting', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          <Fragment>
            <Stateful key="a" />
          </Fragment>
        </Fragment>
      ) : (
        <Fragment>
          <Stateful key="a" />
        </Fragment>
      );

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

  it('should not preserve state of children if nested 2 levels without siblings', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Stateful key="a" />
      ) : (
        <Fragment>
          <Fragment>
            <Stateful key="a" />
          </Fragment>
        </Fragment>
      );

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

  it('should not preserve state of children if nested 2 levels with siblings', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Stateful key="a" />
      ) : (
        <Fragment>
          <Fragment>
            <Stateful key="a" />
          </Fragment>
          <div />
        </Fragment>
      );


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

  it('should preserve state between array nested in fragment and fragment', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          <Stateful key="a" />
        </Fragment>
      ) : (
        <Fragment>
          {[<Stateful key="a" />]}
        </Fragment>
      );

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

  it('should preserve state between top level fragment and array', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        [<Stateful key="a" />]
      ) : (
        <React.Fragment>
          <Stateful key="a" />
        </React.Fragment>
      );

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

  it('should not preserve state between array nested in fragment and double nested fragment', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          {[<Stateful key="a" />]}
        </Fragment>
      ) : (
        <Fragment>
          <Fragment>
            <Stateful key="a" />
          </Fragment>
        </Fragment>
      );

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

  it('should not preserve state between array nested in fragment and double nested array', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          {[<Stateful key="a" />]}
        </Fragment>
      ) : (
        [[<Stateful key="a" />]]
      );

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

  it('should preserve state between double nested fragment and double nested array', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment>
          <Fragment>
            <Stateful key="a" />
          </Fragment>
        </Fragment>
      ) : (
        [[<Stateful key="a" />]]
      );

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

  it('should not preserve state of children when the keys are different', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment key="a">
          <Stateful />
        </Fragment>
      ) : (
        <Fragment key="b">
          <Stateful />
          <span>World</span>
        </Fragment>
      );

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

  it('should not preserve state between unkeyed and keyed fragment', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <Fragment key="a">
          <Stateful />
        </Fragment>
      ) : (
        <Fragment>
          <Stateful />
        </Fragment>
      );

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

  it('should preserve state with reordering in multiple levels', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
        <div>
          <Fragment key="c">
            <span>foo</span>
            <div key="b">
              <Stateful key="a" />
            </div>
          </Fragment>
          <span>boop</span>
        </div>
      ) : (
        <div>
          <span>beep</span>
          <Fragment key="c">
            <div key="b">
              <Stateful key="a" />
            </div>
            <span>bar</span>
          </Fragment>
        </div>
      );

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

  it('should not preserve state when switching to a keyed fragment to an array', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition ? (
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

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(div(), span())]);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildren()).toEqual([div(div(), span())]);
  });

  it('should preserve state when it does not change positions', () => {
    const ops = [];

    class Stateful extends Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    const Foo = ({condition}) =>
      condition
        ? [
            <span />,
            <Fragment>
              <Stateful />
            </Fragment>,
          ]
        : [
            <span />,
            <Fragment>
              <Stateful />
            </Fragment>,
          ];

    ReactNoop.render(<Foo condition={true} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    ReactNoop.render(<Foo condition={false} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([span(), div()]);

    ReactNoop.render(<Foo condition={true} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildren()).toEqual([span(), div()]);
  });
});
