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
let ReactNoop;

describe('ReactFragment', () => {
  beforeEach(function() {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined, hidden: false};
  }

  function span(prop) {
    const inst = {
      type: 'span',
      children: [],
      prop,
      hidden: false,
    };
    return inst;
  }

  it('should render a single child via noop renderer', () => {
    const element = (
      <React.Fragment>
        <span>foo</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildrenAsJSX()).toEqual(<span>foo</span>);
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

    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        hello <span>world</span>
      </React.Fragment>,
    );
  });

  it('should render an iterable via noop renderer', () => {
    const element = (
      <React.Fragment>
        {new Set([<span key="a">hi</span>, <span key="b">bye</span>])}
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <span>hi</span>
        <span>bye</span>
      </React.Fragment>,
    );
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <div>Hello</div>
        <div>World</div>
      </React.Fragment>,
    );

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <div />
        <div>Hello</div>
      </React.Fragment>,
    );

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <div>Hello</div>
        <div />
      </React.Fragment>,
    );

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <div>Hello</div>
        <span>World</span>
      </React.Fragment>,
    );

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(<div>Hello</div>);
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
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <div>
        <span>beep</span>
        <div>
          <div>Hello</div>
        </div>
        <span>bar</span>
      </div>,
    );

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <div>
        <span>foo</span>
        <div>
          <div>Hello</div>
        </div>
        <span>boop</span>
      </div>,
    );
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
    ReactNoop.flush();

    ReactNoop.render(<Foo condition={false} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <div>
        <div>Hello</div>
        <span />
      </div>,
    );

    ReactNoop.render(<Foo condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <div>
        <div>Hello</div>
        <span />
      </div>,
    );
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
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    ReactNoop.render(<Foo condition={false} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    expect(ops).toEqual(['Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <span />
        <div>Hello</div>
      </React.Fragment>,
    );

    ReactNoop.render(<Foo condition={true} />);
    expect(ReactNoop.flush).toWarnDev(
      'Each child in an array or iterator should have a unique "key" prop.',
    );

    expect(ops).toEqual(['Update Stateful', 'Update Stateful']);
    expect(ReactNoop.getChildrenAsJSX()).toEqual(
      <React.Fragment>
        <span />
        <div>Hello</div>
      </React.Fragment>,
    );
  });
});
