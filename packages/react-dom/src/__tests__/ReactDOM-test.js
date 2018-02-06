/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
let ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

describe('ReactDOM', () => {
  // TODO: uncomment this test once we can run in phantom, which
  // supports real submit events.
  /*
  it('should bubble onSubmit', function() {
    const count = 0;
    const form;
    const Parent = React.createClass({
      handleSubmit: function() {
        count++;
        return false;
      },
      render: function() {
        return <Child />;
      }
    });
    const Child = React.createClass({
      render: function() {
        return <form><input type="submit" value="Submit" /></form>;
      },
      componentDidMount: function() {
        form = ReactDOM.findDOMNode(this);
      }
    });
    const instance = ReactTestUtils.renderIntoDocument(<Parent />);
    form.submit();
    expect(count).toEqual(1);
  });
  */

  it('allows a DOM element to be used with a string', () => {
    const element = React.createElement('div', {className: 'foo'});
    const instance = ReactTestUtils.renderIntoDocument(element);
    expect(ReactDOM.findDOMNode(instance).tagName).toBe('DIV');
  });

  it('should allow children to be passed as an argument', () => {
    const argDiv = ReactTestUtils.renderIntoDocument(
      React.createElement('div', null, 'child'),
    );
    const argNode = ReactDOM.findDOMNode(argDiv);
    expect(argNode.innerHTML).toBe('child');
  });

  it('should overwrite props.children with children argument', () => {
    const conflictDiv = ReactTestUtils.renderIntoDocument(
      React.createElement('div', {children: 'fakechild'}, 'child'),
    );
    const conflictNode = ReactDOM.findDOMNode(conflictDiv);
    expect(conflictNode.innerHTML).toBe('child');
  });

  /**
   * We need to make sure that updates occur to the actual node that's in the
   * DOM, instead of a stale cache.
   */
  it('should purge the DOM cache when removing nodes', () => {
    let myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dog" />,
        <div key="theBird" className="bird" />
      </div>,
    );
    // Warm the cache with theDog
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dogbeforedelete" />,
        <div key="theBird" className="bird" />,
      </div>,
    );
    // Remove theDog - this should purge the cache
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theBird" className="bird" />,
      </div>,
    );
    // Now, put theDog back. It's now a different DOM node.
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dog" />,
        <div key="theBird" className="bird" />,
      </div>,
    );
    // Change the className of theDog. It will use the same element
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="bigdog" />,
        <div key="theBird" className="bird" />,
      </div>,
    );
    const root = ReactDOM.findDOMNode(myDiv);
    const dog = root.childNodes[0];
    expect(dog.className).toBe('bigdog');
  });

  it('throws in render() if the mount callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    const myDiv = document.createElement('div');
    expect(() => {
      expect(() => {
        ReactDOM.render(<A />, myDiv, 'no');
      }).toWarnDev(
        'render(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: no.',
      );
    }).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: no',
    );

    expect(() => {
      expect(() => {
        ReactDOM.render(<A />, myDiv, {foo: 'bar'});
      }).toWarnDev(
        'render(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
    }).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );

    expect(() => {
      expect(() => {
        ReactDOM.render(<A />, myDiv, new Foo());
      }).toWarnDev(
        'render(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
    }).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );
  });

  it('throws in render() if the update callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    const myDiv = document.createElement('div');
    ReactDOM.render(<A />, myDiv);
    expect(() => {
      expect(() => {
        ReactDOM.render(<A />, myDiv, 'no');
      }).toWarnDev(
        'render(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: no.',
      );
    }).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: no',
    );

    ReactDOM.render(<A />, myDiv); // Re-mount
    expect(() => {
      expect(() => {
        ReactDOM.render(<A />, myDiv, {foo: 'bar'});
      }).toWarnDev(
        'render(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
    }).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );

    ReactDOM.render(<A />, myDiv); // Re-mount
    expect(() => {
      expect(() => {
        ReactDOM.render(<A />, myDiv, new Foo());
      }).toWarnDev(
        'render(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
    }).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );
  });

  it('preserves focus', () => {
    let input;
    let input2;
    class A extends React.Component {
      render() {
        return (
          <div>
            <input id="one" ref={r => (input = input || r)} />
            {this.props.showTwo && (
              <input id="two" ref={r => (input2 = input2 || r)} />
            )}
          </div>
        );
      }

      componentDidUpdate() {
        // Focus should have been restored to the original input
        expect(document.activeElement.id).toBe('one');
        input2.focus();
        expect(document.activeElement.id).toBe('two');
        log.push('input2 focused');
      }
    }

    const log = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(<A showTwo={false} />, container);
    input.focus();

    // When the second input is added, let's simulate losing focus, which is
    // something that could happen when manipulating DOM nodes (but is hard to
    // deterministically force without relying intensely on React DOM
    // implementation details)
    const div = container.firstChild;
    ['appendChild', 'insertBefore'].forEach(name => {
      const mutator = div[name];
      div[name] = function() {
        if (input) {
          input.blur();
          expect(document.activeElement.tagName).toBe('BODY');
          log.push('input2 inserted');
        }
        return mutator.apply(this, arguments);
      };
    });

    expect(document.activeElement.id).toBe('one');
    ReactDOM.render(<A showTwo={true} />, container);
    // input2 gets added, which causes input to get blurred. Then
    // componentDidUpdate focuses input2 and that should make it down to here,
    // not get overwritten by focus restoration.
    expect(document.activeElement.id).toBe('two');
    expect(log).toEqual(['input2 inserted', 'input2 focused']);
    document.body.removeChild(container);
  });

  it('calls focus() on autoFocus elements after they have been mounted to the DOM', () => {
    const originalFocus = HTMLElement.prototype.focus;

    try {
      let focusedElement;
      let inputFocusedAfterMount = false;

      // This test needs to determine that focus is called after mount.
      // Can't check document.activeElement because PhantomJS is too permissive;
      // It doesn't require element to be in the DOM to be focused.
      HTMLElement.prototype.focus = function() {
        focusedElement = this;
        inputFocusedAfterMount = !!this.parentNode;
      };

      const container = document.createElement('div');
      document.body.appendChild(container);
      ReactDOM.render(
        <div>
          <h1>Auto-focus Test</h1>
          <input autoFocus={true} />
          <p>The above input should be focused after mount.</p>
        </div>,
        container,
      );

      expect(inputFocusedAfterMount).toBe(true);
      expect(focusedElement.tagName).toBe('INPUT');
    } finally {
      HTMLElement.prototype.focus = originalFocus;
    }
  });

  it("shouldn't fire duplicate event handler while handling other nested dispatch", () => {
    const actual = [];

    function click(node) {
      const fakeNativeEvent = function() {};
      fakeNativeEvent.target = node;
      fakeNativeEvent.path = [node, container];
      ReactTestUtils.simulateNativeEventOnNode(
        'topClick',
        node,
        fakeNativeEvent,
      );
    }

    class Wrapper extends React.Component {
      componentDidMount() {
        click(this.ref1);
      }

      render() {
        return (
          <div>
            <div
              onClick={() => {
                actual.push('1st node clicked');
                click(this.ref2);
              }}
              ref={ref => (this.ref1 = ref)}
            />
            <div
              onClick={ref => {
                actual.push("2nd node clicked imperatively from 1st's handler");
              }}
              ref={ref => (this.ref2 = ref)}
            />
          </div>
        );
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(<Wrapper />, container);

    const expected = [
      '1st node clicked',
      "2nd node clicked imperatively from 1st's handler",
    ];
    expect(actual).toEqual(expected);
  });

  it('should not crash with devtools installed', () => {
    try {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        inject: function() {},
        onCommitFiberRoot: function() {},
        onCommitFiberUnmount: function() {},
        supportsFiber: true,
      };
      jest.resetModules();
      React = require('react');
      ReactDOM = require('react-dom');
      class Component extends React.Component {
        render() {
          return <div />;
        }
      }
      ReactDOM.render(<Component />, document.createElement('container'));
    } finally {
      delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    }
  });

  it('throws in DEV if jsdom is destroyed by the time setState() is called', () => {
    class App extends React.Component {
      state = {x: 1};
      render() {
        return <div />;
      }
    }
    const container = document.createElement('div');
    const instance = ReactDOM.render(<App />, container);
    const documentDescriptor = Object.getOwnPropertyDescriptor(
      global,
      'document',
    );
    try {
      // Emulate jsdom environment cleanup.
      // This is roughly what happens if the test finished and then
      // an asynchronous callback tried to setState() after this.
      delete global.document;
      const fn = () => instance.setState({x: 2});
      if (__DEV__) {
        expect(fn).toThrow(
          'The `document` global was defined when React was initialized, but is not ' +
            'defined anymore. This can happen in a test environment if a component ' +
            'schedules an update from an asynchronous callback, but the test has already ' +
            'finished running. To solve this, you can either unmount the component at ' +
            'the end of your test (and ensure that any asynchronous operations get ' +
            'canceled in `componentWillUnmount`), or you can change the test itself ' +
            'to be asynchronous.',
        );
      } else {
        expect(fn).not.toThrow();
      }
    } finally {
      // Don't break other tests.
      Object.defineProperty(global, 'document', documentDescriptor);
    }
  });
});
