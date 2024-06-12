/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

// NOTE: We're explicitly not using JSX here. This is intended to test
// the current stack addendum without having source location added by babel.

'use strict';

let React;
let ReactDOMClient;
let act;

describe('ReactChildReconciler', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
  });

  function createIterable(array) {
    return {
      '@@iterator': function () {
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

  function makeIterableFunction(value) {
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

  it('does not treat functions as iterables', async () => {
    const iterableFunction = makeIterableFunction('foo');

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render(
          <div>
            <h1>{iterableFunction}</h1>
          </div>,
        );
      });
    }).toErrorDev('Functions are not valid as a React child');
    const node = container.firstChild;

    expect(node.innerHTML).toContain(''); // h1
  });

  it('warns for duplicated array keys', async () => {
    class Component extends React.Component {
      render() {
        return <div>{[<div key="1" />, <div key="1" />]}</div>;
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render(<Component />);
      });
    }).toErrorDev(
      'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.',
    );
  });

  it('warns for duplicated array keys with component stack info', async () => {
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

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render(<GrandParent />);
      });
    }).toErrorDev(
      'Encountered two children with the same key, `1`. ' +
        'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.\n' +
        '    in div (at **)\n' +
        (gate(flags => flags.enableOwnerStacks) ? '' : '    in div (at **)\n') +
        '    in Component (at **)\n' +
        (gate(flags => flags.enableOwnerStacks)
          ? ''
          : '    in Parent (at **)\n') +
        '    in GrandParent (at **)',
    );
  });

  it('warns for duplicated iterable keys', async () => {
    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render(<Component />);
      });
    }).toErrorDev(
      'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.',
    );
  });

  it('warns for duplicated iterable keys with component stack info', async () => {
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

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render(<GrandParent />);
      });
    }).toErrorDev(
      'Encountered two children with the same key, `1`. ' +
        'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.\n' +
        '    in div (at **)\n' +
        (gate(flags => flags.enableOwnerStacks) ? '' : '    in div (at **)\n') +
        '    in Component (at **)\n' +
        (gate(flags => flags.enableOwnerStacks)
          ? ''
          : '    in Parent (at **)\n') +
        '    in GrandParent (at **)',
    );
  });
});
