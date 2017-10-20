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
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function text(val) {
    return {text: val};
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

    function Fragment({condition}) {
      return condition
        ? <Stateful key="a" />
        : <React.Fragment>
            <Stateful key="a" />
            <div key="b">World</div>
          </React.Fragment>;
    }

    ReactNoop.render(
      <div>
        <Fragment />
        <div />
      </div>,
    );
    ReactNoop.flush();

    ReactNoop.render(
      <div>
        <Fragment condition={true} />
        <div />
      </div>,
    );
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
  });

  it('should not preserve state of children if no siblings and nested', function() {
    var ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <Stateful key="a" />
        : <React.Fragment>
            <React.Fragment>
              <Stateful key="a" />
            </React.Fragment>
          </React.Fragment>;
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
  });

  it('should not preserve state of children if nested with siblings', function() {
    var ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <Stateful key="a" />
        : <React.Fragment>
            <React.Fragment>
              <Stateful key="a" />
            </React.Fragment>
            <div />
          </React.Fragment>;
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
  });

  it('should preserve state of children in a reorder', function() {
    var ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <React.Fragment>
            <div />
            <React.Fragment key="d">
              <div key="b">World</div>
              <Stateful key="a" />
            </React.Fragment>
          </React.Fragment>
        : <React.Fragment>
            <React.Fragment key="d">
              <Stateful key="a" />
              <div key="b">World</div>
            </React.Fragment>
            <div key="c" />
          </React.Fragment>;
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
  });

  it('should preserve state of children when the keys are same', function() {
    var ops = [];

    class Stateful extends React.Component {
      componentDidUpdate() {
        ops.push('Update Stateful');
      }

      render() {
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <React.Fragment key="a">
            <Stateful />
          </React.Fragment>
        : <React.Fragment key="a">
            <Stateful />
            <div />
            <span>World</span>
          </React.Fragment>;
    }

    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
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

    function Fragment({condition}) {
      return condition
        ? <React.Fragment key="a">
            <Stateful />
          </React.Fragment>
        : <React.Fragment key="b">
            <Stateful />
            <span>World</span>
          </React.Fragment>;
    }

    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual([]);
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

    function Fragment({condition}) {
      return condition
        ? <div>
            <React.Fragment key="c">
              <span>foo</span>
              <div key="b">
                <Stateful key="a" />
              </div>
            </React.Fragment>
            <span>boop</span>
          </div>
        : <div>
            <span>beep</span>
            <React.Fragment key="c">
              <div key="b">
                <Stateful key="a" />
              </div>
              <span>bar</span>
            </React.Fragment>
          </div>;
    }

    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
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

    function Fragment({condition}) {
      return condition
        ? <div>
            <React.Fragment key="c">
              <span>foo</span>
              <div key="b">
                <Stateful key="a" />
              </div>
            </React.Fragment>
            <span>boop</span>
          </div>
        : <div>
            <span>beep</span>
            <React.Fragment key="c">
              <div key="b">
                <Stateful key="a" />
              </div>
              <span>bar</span>
            </React.Fragment>
          </div>;
    }

    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    expect(ops).toEqual(['Update Stateful']);
  });
});
