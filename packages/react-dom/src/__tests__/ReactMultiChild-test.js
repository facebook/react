/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactMultiChild', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  describe('reconciliation', () => {
    it('should update children when possible', () => {
      const container = document.createElement('div');

      const mockMount = jest.fn();
      const mockUpdate = jest.fn();
      const mockUnmount = jest.fn();

      class MockComponent extends React.Component {
        componentDidMount = mockMount;
        componentDidUpdate = mockUpdate;
        componentWillUnmount = mockUnmount;
        render() {
          return <span />;
        }
      }

      expect(mockMount).toHaveBeenCalledTimes(0);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <div>
          <MockComponent />
        </div>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(0);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <div>
          <MockComponent />
        </div>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUnmount).toHaveBeenCalledTimes(0);
    });

    it('should replace children with different constructors', () => {
      const container = document.createElement('div');

      const mockMount = jest.fn();
      const mockUnmount = jest.fn();

      class MockComponent extends React.Component {
        componentDidMount = mockMount;
        componentWillUnmount = mockUnmount;
        render() {
          return <span />;
        }
      }

      expect(mockMount).toHaveBeenCalledTimes(0);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <div>
          <MockComponent />
        </div>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <div>
          <span />
        </div>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUnmount).toHaveBeenCalledTimes(1);
    });

    it('should NOT replace children with different owners', () => {
      const container = document.createElement('div');

      const mockMount = jest.fn();
      const mockUnmount = jest.fn();

      class MockComponent extends React.Component {
        componentDidMount = mockMount;
        componentWillUnmount = mockUnmount;
        render() {
          return <span />;
        }
      }

      class WrapperComponent extends React.Component {
        render() {
          return this.props.children || <MockComponent />;
        }
      }

      expect(mockMount).toHaveBeenCalledTimes(0);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(<WrapperComponent />, container);

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <WrapperComponent>
          <MockComponent />
        </WrapperComponent>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUnmount).toHaveBeenCalledTimes(0);
    });

    it('should replace children with different keys', () => {
      const container = document.createElement('div');

      const mockMount = jest.fn();
      const mockUnmount = jest.fn();

      class MockComponent extends React.Component {
        componentDidMount = mockMount;
        componentWillUnmount = mockUnmount;
        render() {
          return <span />;
        }
      }

      expect(mockMount).toHaveBeenCalledTimes(0);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <div>
          <MockComponent key="A" />
        </div>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(1);
      expect(mockUnmount).toHaveBeenCalledTimes(0);

      ReactDOM.render(
        <div>
          <MockComponent key="B" />
        </div>,
        container,
      );

      expect(mockMount).toHaveBeenCalledTimes(2);
      expect(mockUnmount).toHaveBeenCalledTimes(1);
    });

    it('should warn for duplicated array keys with component stack info', () => {
      const container = document.createElement('div');

      class WrapperComponent extends React.Component {
        render() {
          return <div>{this.props.children}</div>;
        }
      }

      class Parent extends React.Component {
        render() {
          return (
            <div>
              <WrapperComponent>{this.props.children}</WrapperComponent>
            </div>
          );
        }
      }

      ReactDOM.render(<Parent>{[<div key="1" />]}</Parent>, container);

      expect(() =>
        ReactDOM.render(
          <Parent>{[<div key="1" />, <div key="1" />]}</Parent>,
          container,
        ),
      ).toErrorDev(
        'Encountered two children with the same key, `1`. ' +
          'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.\n' +
          '    in div (at **)\n' +
          '    in WrapperComponent (at **)\n' +
          '    in div (at **)\n' +
          '    in Parent (at **)',
      );
    });

    it('should warn for duplicated iterable keys with component stack info', () => {
      const container = document.createElement('div');

      class WrapperComponent extends React.Component {
        render() {
          return <div>{this.props.children}</div>;
        }
      }

      class Parent extends React.Component {
        render() {
          return (
            <div>
              <WrapperComponent>{this.props.children}</WrapperComponent>
            </div>
          );
        }
      }

      function createIterable(array) {
        return {
          '@@iterator': function() {
            let i = 0;
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

      ReactDOM.render(
        <Parent>{createIterable([<div key="1" />])}</Parent>,
        container,
      );

      expect(() =>
        ReactDOM.render(
          <Parent>{createIterable([<div key="1" />, <div key="1" />])}</Parent>,
          container,
        ),
      ).toErrorDev(
        'Encountered two children with the same key, `1`. ' +
          'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.\n' +
          '    in div (at **)\n' +
          '    in WrapperComponent (at **)\n' +
          '    in div (at **)\n' +
          '    in Parent (at **)',
      );
    });
  });

  it('should warn for using maps as children with owner info', () => {
    class Parent extends React.Component {
      render() {
        return (
          <div>
            {
              new Map([
                ['foo', 0],
                ['bar', 1],
              ])
            }
          </div>
        );
      }
    }
    const container = document.createElement('div');
    expect(() => ReactDOM.render(<Parent />, container)).toErrorDev(
      'Using Maps as children is not supported. ' +
        'Use an array of keyed ReactElements instead.\n' +
        '    in div (at **)\n' +
        '    in Parent (at **)',
    );
  });

  it('should warn for using generators as children', () => {
    function* Foo() {
      yield (<h1 key="1">Hello</h1>);
      yield (<h1 key="2">World</h1>);
    }

    const div = document.createElement('div');
    expect(() => {
      ReactDOM.render(<Foo />, div);
    }).toErrorDev(
      'Using Generators as children is unsupported and will likely yield ' +
        'unexpected results because enumerating a generator mutates it. You may ' +
        'convert it to an array with `Array.from()` or the `[...spread]` operator ' +
        'before rendering. Keep in mind you might need to polyfill these features for older browsers.\n' +
        '    in Foo (at **)',
    );

    // Test de-duplication
    ReactDOM.render(<Foo />, div);
  });

  it('should not warn for using generators in legacy iterables', () => {
    const fooIterable = {
      '@@iterator': function*() {
        yield (<h1 key="1">Hello</h1>);
        yield (<h1 key="2">World</h1>);
      },
    };

    function Foo() {
      return fooIterable;
    }

    const div = document.createElement('div');
    ReactDOM.render(<Foo />, div);
    expect(div.textContent).toBe('HelloWorld');

    ReactDOM.render(<Foo />, div);
    expect(div.textContent).toBe('HelloWorld');
  });

  it('should not warn for using generators in modern iterables', () => {
    const fooIterable = {
      [Symbol.iterator]: function*() {
        yield (<h1 key="1">Hello</h1>);
        yield (<h1 key="2">World</h1>);
      },
    };

    function Foo() {
      return fooIterable;
    }

    const div = document.createElement('div');
    ReactDOM.render(<Foo />, div);
    expect(div.textContent).toBe('HelloWorld');

    ReactDOM.render(<Foo />, div);
    expect(div.textContent).toBe('HelloWorld');
  });

  it('should reorder bailed-out children', () => {
    class LetterInner extends React.Component {
      render() {
        return <div>{this.props.char}</div>;
      }
    }

    class Letter extends React.Component {
      render() {
        return <LetterInner char={this.props.char} />;
      }
      shouldComponentUpdate() {
        return false;
      }
    }

    class Letters extends React.Component {
      render() {
        const letters = this.props.letters.split('');
        return (
          <div>
            {letters.map(c => (
              <Letter key={c} char={c} />
            ))}
          </div>
        );
      }
    }

    const container = document.createElement('div');

    // Two random strings -- some additions, some removals, some moves
    ReactDOM.render(<Letters letters="XKwHomsNjIkBcQWFbiZU" />, container);
    expect(container.textContent).toBe('XKwHomsNjIkBcQWFbiZU');
    ReactDOM.render(<Letters letters="EHCjpdTUuiybDvhRJwZt" />, container);
    expect(container.textContent).toBe('EHCjpdTUuiybDvhRJwZt');
  });

  it('prepares new children before unmounting old', () => {
    const log = [];

    class Spy extends React.Component {
      UNSAFE_componentWillMount() {
        log.push(this.props.name + ' componentWillMount');
      }
      render() {
        log.push(this.props.name + ' render');
        return <div />;
      }
      componentDidMount() {
        log.push(this.props.name + ' componentDidMount');
      }
      componentWillUnmount() {
        log.push(this.props.name + ' componentWillUnmount');
      }
    }

    // These are reference-unequal so they will be swapped even if they have
    // matching keys
    const SpyA = props => <Spy {...props} />;
    const SpyB = props => <Spy {...props} />;

    const container = document.createElement('div');
    ReactDOM.render(
      <div>
        <SpyA key="one" name="oneA" />
        <SpyA key="two" name="twoA" />
      </div>,
      container,
    );
    ReactDOM.render(
      <div>
        <SpyB key="one" name="oneB" />
        <SpyB key="two" name="twoB" />
      </div>,
      container,
    );

    expect(log).toEqual([
      'oneA componentWillMount',
      'oneA render',
      'twoA componentWillMount',
      'twoA render',
      'oneA componentDidMount',
      'twoA componentDidMount',

      'oneB componentWillMount',
      'oneB render',
      'twoB componentWillMount',
      'twoB render',
      'oneA componentWillUnmount',
      'twoA componentWillUnmount',

      'oneB componentDidMount',
      'twoB componentDidMount',
    ]);
  });
});
