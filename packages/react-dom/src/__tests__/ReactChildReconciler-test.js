/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

// NOTE: We're explicitly not using JSX here. This is intended to test
// the current stack addendum without having source location added by babel.

'use strict';

var React;
var ReactTestUtils;
var ReactDOM;

describe('ReactChildReconciler', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
    ReactDOM = require('react-dom');
  });

  function createIterable(array) {
    return {
      '@@iterator': function() {
        var i = 0;
        return {
          next() {
            const next = {
              value: i < array.length ? array[i] : undefined,
              done: i === array.length,
            };
            i++;
            return next;
          },
        };
      },
    };
  }

  function makeRenderableFunction(value) {
    const fn = () => {};
    fn['@@iterator'] = function iterator() {
      let timesCalled = 0;
      return {
        next() {
          const done = timesCalled++ > 0;
          return {done, value: done ? undefined : value};
        },
      };
    };
    return fn;
  }

  it('renders iterable functions', () => {
    const f1 = makeRenderableFunction('f1');
    const f2 = makeRenderableFunction('f2');

    const comp = ReactTestUtils.renderIntoDocument(
      <div>
        <div>{f1}</div>
        {f2}
      </div>,
    );
    expect(comp.outerHTML).toContain('f1');
    expect(comp.outerHTML).toContain('f2');
  });

  it('can update iterable functions', () => {
    const f1 = makeRenderableFunction('f1');
    const f2 = makeRenderableFunction('f2');

    class Parent extends React.Component {
      render() {
        return (
          <div>
            <div>{f1}</div>
            {f2}
          </div>
        );
      }
    }

    const comp = ReactTestUtils.renderIntoDocument(<Parent />);
    const initial = ReactDOM.findDOMNode(comp).outerHTML;
    comp.forceUpdate();
    const rerendered = ReactDOM.findDOMNode(comp).outerHTML;
    expect(rerendered).toBe(initial);
  });

  it('can replace a keyed array with an iterable function', () => {
    class Parent extends React.Component {
      state = {children: <div key="a" />};
      setChildren(children) {
        this.setState({children});
      }
      render() {
        return <div>{this.state.children}</div>;
      }
    }

    const comp = ReactTestUtils.renderIntoDocument(<Parent />);
    comp.setChildren([makeRenderableFunction('I am Batman')]);
    expect(ReactDOM.findDOMNode(comp).textContent).toBe('I am Batman');
  });

  it('warns for duplicated array keys', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{[<div key="1" />, <div key="1" />]}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.',
      );
    }
  });

  it('warns for duplicated array keys with component stack info', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{[<div key="1" />, <div key="1" />]}</div>;
      }
    }

    class Parent extends React.Component {
      render() {
        return React.cloneElement(this.props.child);
      }
    }

    class GrandParent extends React.Component {
      render() {
        return <Parent child={<Component />} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toContain(
        'Encountered two children with the same key, `1`. ' +
          'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.',
        '    in div (at **)\n' +
          '    in Component (at **)\n' +
          '    in Parent (at **)\n' +
          '    in GrandParent (at **)',
      );
    }
  });

  it('warns for duplicated iterable keys', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.',
      );
    }
  });

  it('warns for duplicated iterable keys with component stack info', () => {
    spyOnDev(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    class Parent extends React.Component {
      render() {
        return React.cloneElement(this.props.child);
      }
    }

    class GrandParent extends React.Component {
      render() {
        return <Parent child={<Component />} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toContain(
        'Encountered two children with the same key, `1`. ' +
          'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.',
        '    in div (at **)\n' +
          '    in Component (at **)\n' +
          '    in Parent (at **)\n' +
          '    in GrandParent (at **)',
      );
    }
  });
});
