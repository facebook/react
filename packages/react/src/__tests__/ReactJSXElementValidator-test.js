/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// TODO: All these warnings should become static errors using Flow instead
// of dynamic errors when using JSX with Flow.
let act;
let React;
let ReactDOMClient;

describe('ReactJSXElementValidator', () => {
  let Component;
  let RequiredPropComponent;

  beforeEach(() => {
    jest.resetModules();

    act = require('internal-test-utils').act;
    React = require('react');
    ReactDOMClient = require('react-dom/client');

    Component = class extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    };

    RequiredPropComponent = class extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    };
    RequiredPropComponent.displayName = 'RequiredPropComponent';
  });

  it('warns for keys for arrays of elements in children position', async () => {
    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<Component>{[<Component />, <Component />]}</Component>);
      });
    }).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('warns for keys for arrays of elements with owner info', async () => {
    class InnerComponent extends React.Component {
      render() {
        return <Component>{this.props.childSet}</Component>;
      }
    }

    class ComponentWrapper extends React.Component {
      render() {
        return <InnerComponent childSet={[<Component />, <Component />]} />;
      }
    }

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<ComponentWrapper />);
      });
    }).toErrorDev([
      'Each child in a list should have a unique "key" prop.' +
        '\n\nCheck the render method of `' +
        (gate(flag => flag.enableOwnerStacks)
          ? 'Component'
          : 'InnerComponent') +
        '`. ' +
        'It was passed a child from ComponentWrapper. ',
    ]);
  });

  it('warns for keys for iterables of elements in rest args', async () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {value: done ? undefined : <Component />, done: done};
          },
        };
      },
    };

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<Component>{iterable}</Component>);
      });
    }).toErrorDev(
      gate(flag => flag.enableOwnerStacks)
        ? ['Each child in a list should have a unique "key" prop.']
        : // Since each pass generates a new element, it doesn't get marked as
          // validated and it gets rechecked each time.
          [
            'Each child in a list should have a unique "key" prop.',
            'Each child in a list should have a unique "key" prop.',
            'Each child in a list should have a unique "key" prop.',
          ],
    );
  });

  it('does not warn for arrays of elements with keys', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(
        <Component>
          {[<Component key="#1" />, <Component key="#2" />]}
        </Component>,
      );
    });
  });

  it('does not warn for iterable elements with keys', async () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {
              value: done ? undefined : <Component key={'#' + i} />,
              done: done,
            };
          },
        };
      },
    };

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(<Component>{iterable}</Component>);
    });
  });

  it('does not warn for numeric keys in entry iterable as a child', async () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {value: done ? undefined : [i, <Component />], done: done};
          },
        };
      },
    };
    iterable.entries = iterable['@@iterator'];

    // This only applies to the warning during construction.
    // We do warn if it's actually rendered.
    <Component>{iterable}</Component>;
  });

  it('does not warn when the element is directly as children', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <Component>
          <Component />
          <Component />
        </Component>,
      );
    });
  });

  it('does not warn when the child array contains non-elements', () => {
    void (<Component>{[{}, {}]}</Component>);
  });

  it('should give context for errors in nested components.', async () => {
    class MyComp extends React.Component {
      render() {
        return [<div />];
      }
    }
    class ParentComp extends React.Component {
      render() {
        return <MyComp />;
      }
    }
    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<ParentComp />);
      });
    }).toErrorDev(
      'Each child in a list should have a unique "key" prop.' +
        '\n\nCheck the render method of `ParentComp`. It was passed a child from MyComp. ' +
        'See https://react.dev/link/warning-keys for more information.\n' +
        '    in div (at **)\n' +
        '    in MyComp (at **)\n' +
        '    in ParentComp (at **)',
    );
  });

  it('warns for fragments with illegal attributes', async () => {
    class Foo extends React.Component {
      render() {
        return <React.Fragment a={1}>hello</React.Fragment>;
      }
    }

    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Foo />);
      });
    }).toErrorDev(
      'Invalid prop `a` supplied to `React.Fragment`. React.Fragment ' +
        'can only have `key` and `children` props.',
    );
  });

  it('warns for fragments with refs', async () => {
    class Foo extends React.Component {
      render() {
        return (
          <React.Fragment
            ref={bar => {
              this.foo = bar;
            }}>
            hello
          </React.Fragment>
        );
      }
    }

    if (gate(flags => flags.enableRefAsProp)) {
      await expect(async () => {
        const container = document.createElement('div');
        const root = ReactDOMClient.createRoot(container);
        await act(() => {
          root.render(<Foo />);
        });
      }).toErrorDev('Invalid prop `ref` supplied to `React.Fragment`.');
    } else {
      await expect(async () => {
        const container = document.createElement('div');
        const root = ReactDOMClient.createRoot(container);
        await act(() => {
          root.render(<Foo />);
        });
      }).toErrorDev('Invalid attribute `ref` supplied to `React.Fragment`.');
    }
  });

  it('does not warn for fragments of multiple elements without keys', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <>
          <span>1</span>
          <span>2</span>
        </>,
      );
    });
  });

  it('warns for fragments of multiple elements with same key', async () => {
    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <>
            <span key="a">1</span>
            <span key="a">2</span>
            <span key="b">3</span>
          </>,
        );
      });
    }).toErrorDev('Encountered two children with the same key, `a`.');
  });

  it('does not call lazy initializers eagerly', () => {
    let didCall = false;
    const Lazy = React.lazy(() => {
      didCall = true;
      return {then() {}};
    });
    <Lazy />;
    expect(didCall).toBe(false);
  });
});
