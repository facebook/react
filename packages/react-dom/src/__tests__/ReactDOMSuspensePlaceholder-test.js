/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let Suspense;
let Scheduler;
let act;
let textCache;

describe('ReactDOMSuspensePlaceholder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    Suspense = React.Suspense;
    container = document.createElement('div');
    document.body.appendChild(container);

    textCache = new Map();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.log(text);
    return text;
  }

  it('hides and unhides timed out DOM elements', async () => {
    const divs = [
      React.createRef(null),
      React.createRef(null),
      React.createRef(null),
    ];
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <div ref={divs[0]}>
            <Text text="A" />
          </div>
          <div ref={divs[1]}>
            <AsyncText text="B" />
          </div>
          <div style={{display: 'inline'}} ref={divs[2]}>
            <Text text="C" />
          </div>
        </Suspense>
      );
    }
    ReactDOM.render(<App />, container);
    expect(window.getComputedStyle(divs[0].current).display).toEqual('none');
    expect(window.getComputedStyle(divs[1].current).display).toEqual('none');
    expect(window.getComputedStyle(divs[2].current).display).toEqual('none');

    await act(async () => {
      await resolveText('B');
    });

    expect(window.getComputedStyle(divs[0].current).display).toEqual('block');
    expect(window.getComputedStyle(divs[1].current).display).toEqual('block');
    // This div's display was set with a prop.
    expect(window.getComputedStyle(divs[2].current).display).toEqual('inline');
  });

  it('hides and unhides timed out text nodes', async () => {
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <Text text="A" />
          <AsyncText text="B" />
          <Text text="C" />
        </Suspense>
      );
    }
    ReactDOM.render(<App />, container);
    expect(container.textContent).toEqual('Loading...');

    await act(async () => {
      await resolveText('B');
    });

    expect(container.textContent).toEqual('ABC');
  });

  it(
    'outside concurrent mode, re-hides children if their display is updated ' +
      'but the boundary is still showing the fallback',
    async () => {
      const {useState} = React;

      let setIsVisible;
      function Sibling({children}) {
        const [isVisible, _setIsVisible] = useState(false);
        setIsVisible = _setIsVisible;
        return (
          <span style={{display: isVisible ? 'inline' : 'none'}}>
            {children}
          </span>
        );
      }

      function App() {
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            <Sibling>Sibling</Sibling>
            <span>
              <AsyncText text="Async" />
            </span>
          </Suspense>
        );
      }

      await act(() => {
        ReactDOM.render(<App />, container);
      });
      expect(container.innerHTML).toEqual(
        '<span style="display: none;">Sibling</span><span style=' +
          '"display: none;"></span>Loading...',
      );

      // Update the inline display style. It will be overridden because it's
      // inside a hidden fallback.
      await act(() => setIsVisible(true));
      expect(container.innerHTML).toEqual(
        '<span style="display: none;">Sibling</span><span style=' +
          '"display: none;"></span>Loading...',
      );

      // Unsuspend. The style should now match the inline prop.
      await act(() => resolveText('Async'));
      expect(container.innerHTML).toEqual(
        '<span style="display: inline;">Sibling</span><span style="">Async</span>',
      );
    },
  );

  // Regression test for https://github.com/facebook/react/issues/14188
  it('can call findDOMNode() in a suspended component commit phase', async () => {
    const log = [];
    const Lazy = React.lazy(
      () =>
        new Promise(resolve =>
          resolve({
            default() {
              return 'lazy';
            },
          }),
        ),
    );

    class Child extends React.Component {
      componentDidMount() {
        log.push('cDM ' + this.props.id);
        ReactDOM.findDOMNode(this);
      }
      componentDidUpdate() {
        log.push('cDU ' + this.props.id);
        ReactDOM.findDOMNode(this);
      }
      render() {
        return 'child';
      }
    }

    const buttonRef = React.createRef();
    class App extends React.Component {
      state = {
        suspend: false,
      };
      handleClick = () => {
        this.setState({suspend: true});
      };
      render() {
        return (
          <React.Suspense fallback="Loading">
            <Child id="first" />
            <button ref={buttonRef} onClick={this.handleClick}>
              Suspend
            </button>
            <Child id="second" />
            {this.state.suspend && <Lazy />}
          </React.Suspense>
        );
      }
    }

    ReactDOM.render(<App />, container);

    expect(log).toEqual(['cDM first', 'cDM second']);
    log.length = 0;

    buttonRef.current.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    await Lazy;
    expect(log).toEqual(['cDU first', 'cDU second']);
  });

  // Regression test for https://github.com/facebook/react/issues/14188
  it('can call findDOMNode() in a suspended component commit phase (#2)', () => {
    let suspendOnce = Promise.resolve();
    function Suspend() {
      if (suspendOnce) {
        const promise = suspendOnce;
        suspendOnce = null;
        throw promise;
      }
      return null;
    }

    const log = [];
    class Child extends React.Component {
      componentDidMount() {
        log.push('cDM');
        ReactDOM.findDOMNode(this);
      }

      componentDidUpdate() {
        log.push('cDU');
        ReactDOM.findDOMNode(this);
      }

      render() {
        return null;
      }
    }

    function App() {
      return (
        <Suspense fallback="Loading">
          <Suspend />
          <Child />
        </Suspense>
      );
    }

    ReactDOM.render(<App />, container);
    expect(log).toEqual(['cDM']);
    ReactDOM.render(<App />, container);
    expect(log).toEqual(['cDM', 'cDU']);
  });
});
