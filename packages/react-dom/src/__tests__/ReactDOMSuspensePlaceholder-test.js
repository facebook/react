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
let ReactDOM;
let Suspense;
let ReactCache;
let TextResource;

describe('ReactDOMSuspensePlaceholder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;
    container = document.createElement('div');
    document.body.appendChild(container);

    TextResource = ReactCache.unstable_createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          resolve(text);
        }, ms),
      );
    }, ([text, ms]) => text);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function advanceTimers(ms) {
    // Note: This advances Jest's virtual time but not React's. Use
    // ReactNoop.expire for that.
    if (typeof ms !== 'number') {
      throw new Error('Must specify ms');
    }
    jest.advanceTimersByTime(ms);
    // Wait until the end of the current tick
    // We cannot use a timer since we're faking them
    return Promise.resolve().then(() => {});
  }

  function Text(props) {
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    TextResource.read([props.text, props.ms]);
    return text;
  }

  it('hides and unhides timed out DOM elements', async () => {
    let divs = [
      React.createRef(null),
      React.createRef(null),
      React.createRef(null),
    ];
    function App() {
      return (
        <Suspense maxDuration={500} fallback={<Text text="Loading..." />}>
          <div ref={divs[0]}>
            <Text text="A" />
          </div>
          <div ref={divs[1]}>
            <AsyncText ms={1000} text="B" />
          </div>
          <div style={{display: 'block'}} ref={divs[2]}>
            <Text text="C" />
          </div>
        </Suspense>
      );
    }
    ReactDOM.render(<App />, container);
    expect(divs[0].current.style.display).toEqual('none');
    expect(divs[1].current.style.display).toEqual('none');
    expect(divs[2].current.style.display).toEqual('none');

    await advanceTimers(1000);

    expect(divs[0].current.style.display).toEqual('');
    expect(divs[1].current.style.display).toEqual('');
    // This div's display was set with a prop.
    expect(divs[2].current.style.display).toEqual('block');
  });

  it('hides and unhides timed out text nodes', async () => {
    function App() {
      return (
        <Suspense maxDuration={500} fallback={<Text text="Loading..." />}>
          <Text text="A" />
          <AsyncText ms={1000} text="B" />
          <Text text="C" />
        </Suspense>
      );
    }
    ReactDOM.render(<App />, container);
    expect(container.textContent).toEqual('Loading...');

    await advanceTimers(1000);

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
          <Suspense maxDuration={500} fallback={<Text text="Loading..." />}>
            <Sibling>Sibling</Sibling>
            <span>
              <AsyncText ms={1000} text="Async" />
            </span>
          </Suspense>
        );
      }

      ReactDOM.render(<App />, container);
      expect(container.innerHTML).toEqual(
        '<span style="display: none;">Sibling</span><span style="display: none;"></span>Loading...',
      );

      setIsVisible(true);
      expect(container.innerHTML).toEqual(
        '<span style="display: none;">Sibling</span><span style="display: none;"></span>Loading...',
      );

      await advanceTimers(1000);

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
});
