/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
let ReactDOM = require('react-dom');
let ReactDOMServer = require('react-dom/server');
let ConcurrentMode = React.unstable_ConcurrentMode;

describe('ReactDOMRoot', () => {
  let container;

  let advanceCurrentTime;

  beforeEach(() => {
    container = document.createElement('div');
    // TODO pull this into helper method, reduce repetition.
    // mock the browser APIs which are used in schedule:
    // - requestAnimationFrame should pass the DOMHighResTimeStamp argument
    // - calling 'window.postMessage' should actually fire postmessage handlers
    // - must allow artificially changing time returned by Date.now
    // Performance.now is not supported in the test environment
    const originalDateNow = Date.now;
    let advancedTime = null;
    global.Date.now = function() {
      if (advancedTime) {
        return originalDateNow() + advancedTime;
      }
      return originalDateNow();
    };
    advanceCurrentTime = function(amount) {
      advancedTime = amount;
    };
    global.requestAnimationFrame = function(cb) {
      return setTimeout(() => {
        cb(Date.now());
      });
    };
    const originalAddEventListener = global.addEventListener;
    let postMessageCallback;
    global.addEventListener = function(eventName, callback, useCapture) {
      if (eventName === 'message') {
        postMessageCallback = callback;
      } else {
        originalAddEventListener(eventName, callback, useCapture);
      }
    };
    global.postMessage = function(messageKey, targetOrigin) {
      const postMessageEvent = {source: window, data: messageKey};
      if (postMessageCallback) {
        postMessageCallback(postMessageEvent);
      }
    };

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ConcurrentMode = React.unstable_ConcurrentMode;
  });

  it('renders children', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
  });

  it('unmounts children', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    jest.runAllTimers();
    expect(container.textContent).toEqual('');
  });

  it('`root.render` returns a thenable work object', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const work = root.render(<ConcurrentMode>Hi</ConcurrentMode>);
    let ops = [];
    work.then(() => {
      ops.push('inside callback: ' + container.textContent);
    });
    ops.push('before committing: ' + container.textContent);
    jest.runAllTimers();
    ops.push('after committing: ' + container.textContent);
    expect(ops).toEqual([
      'before committing: ',
      // `then` callback should fire during commit phase
      'inside callback: Hi',
      'after committing: Hi',
    ]);
  });

  it('resolves `work.then` callback synchronously if the work already committed', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const work = root.render(<ConcurrentMode>Hi</ConcurrentMode>);
    jest.runAllTimers();
    let ops = [];
    work.then(() => {
      ops.push('inside callback');
    });
    expect(ops).toEqual(['inside callback']);
  });

  it('supports hydration', async () => {
    const markup = await new Promise(resolve =>
      resolve(
        ReactDOMServer.renderToString(
          <div>
            <span className="extra" />
          </div>,
        ),
      ),
    );

    // Does not hydrate by default
    const container1 = document.createElement('div');
    container1.innerHTML = markup;
    const root1 = ReactDOM.unstable_createRoot(container1);
    root1.render(
      <div>
        <span />
      </div>,
    );
    jest.runAllTimers();

    // Accepts `hydrate` option
    const container2 = document.createElement('div');
    container2.innerHTML = markup;
    const root2 = ReactDOM.unstable_createRoot(container2, {hydrate: true});
    root2.render(
      <div>
        <span />
      </div>,
    );
    expect(jest.runAllTimers).toWarnDev('Extra attributes', {
      withoutStack: true,
    });
  });

  it('does not clear existing children', async () => {
    container.innerHTML = '<div>a</div><div>b</div>';
    const root = ReactDOM.unstable_createRoot(container);
    root.render(
      <div>
        <span>c</span>
        <span>d</span>
      </div>,
    );
    jest.runAllTimers();
    expect(container.textContent).toEqual('abcd');
    root.render(
      <div>
        <span>d</span>
        <span>c</span>
      </div>,
    );
    jest.runAllTimers();
    expect(container.textContent).toEqual('abdc');
  });

  it('can defer a commit by batching it', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const batch = root.createBatch();
    batch.render(<div>Hi</div>);
    // Hasn't committed yet
    expect(container.textContent).toEqual('');
    // Commit
    batch.commit();
    expect(container.textContent).toEqual('Hi');
  });

  it('applies setState in componentDidMount synchronously in a batch', done => {
    class App extends React.Component {
      state = {mounted: false};
      componentDidMount() {
        this.setState({
          mounted: true,
        });
      }
      render() {
        return this.state.mounted ? 'Hi' : 'Bye';
      }
    }

    const root = ReactDOM.unstable_createRoot(container);
    const batch = root.createBatch();
    batch.render(
      <ConcurrentMode>
        <App />
      </ConcurrentMode>,
    );

    jest.runAllTimers();

    // Hasn't updated yet
    expect(container.textContent).toEqual('');

    let ops = [];
    batch.then(() => {
      // Still hasn't updated
      ops.push(container.textContent);

      // Should synchronously commit
      batch.commit();
      ops.push(container.textContent);

      expect(ops).toEqual(['', 'Hi']);
      done();
    });
  });

  it('does not restart a completed batch when committing if there were no intervening updates', () => {
    let ops = [];
    function Foo(props) {
      ops.push('Foo');
      return props.children;
    }
    const root = ReactDOM.unstable_createRoot(container);
    const batch = root.createBatch();
    batch.render(<Foo>Hi</Foo>);
    // Flush all async work.
    jest.runAllTimers();
    // Root should complete without committing.
    expect(ops).toEqual(['Foo']);
    expect(container.textContent).toEqual('');

    ops = [];

    // Commit. Shouldn't re-render Foo.
    batch.commit();
    expect(ops).toEqual([]);
    expect(container.textContent).toEqual('Hi');
  });

  it('can wait for a batch to finish', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const batch = root.createBatch();
    batch.render(<ConcurrentMode>Foo</ConcurrentMode>);

    jest.runAllTimers();

    // Hasn't updated yet
    expect(container.textContent).toEqual('');

    let ops = [];
    batch.then(() => {
      // Still hasn't updated
      ops.push(container.textContent);
      // Should synchronously commit
      batch.commit();
      ops.push(container.textContent);
    });

    expect(ops).toEqual(['', 'Foo']);
  });

  it('`batch.render` returns a thenable work object', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const batch = root.createBatch();
    const work = batch.render('Hi');
    let ops = [];
    work.then(() => {
      ops.push('inside callback: ' + container.textContent);
    });
    ops.push('before committing: ' + container.textContent);
    batch.commit();
    ops.push('after committing: ' + container.textContent);
    expect(ops).toEqual([
      'before committing: ',
      // `then` callback should fire during commit phase
      'inside callback: Hi',
      'after committing: Hi',
    ]);
  });

  it('can commit an empty batch', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<ConcurrentMode>1</ConcurrentMode>);

    advanceCurrentTime(2000);
    // This batch has a later expiration time than the earlier update.
    const batch = root.createBatch();

    // This should not flush the earlier update.
    batch.commit();
    expect(container.textContent).toEqual('');

    jest.runAllTimers();
    expect(container.textContent).toEqual('1');
  });

  it('two batches created simultaneously are committed separately', () => {
    // (In other words, they have distinct expiration times)
    const root = ReactDOM.unstable_createRoot(container);
    const batch1 = root.createBatch();
    batch1.render(1);
    const batch2 = root.createBatch();
    batch2.render(2);

    expect(container.textContent).toEqual('');

    batch1.commit();
    expect(container.textContent).toEqual('1');

    batch2.commit();
    expect(container.textContent).toEqual('2');
  });

  it('commits an earlier batch without committing a later batch', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const batch1 = root.createBatch();
    batch1.render(1);

    // This batch has a later expiration time
    advanceCurrentTime(2000);
    const batch2 = root.createBatch();
    batch2.render(2);

    expect(container.textContent).toEqual('');

    batch1.commit();
    expect(container.textContent).toEqual('1');

    batch2.commit();
    expect(container.textContent).toEqual('2');
  });

  it('commits a later batch without committing an earlier batch', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const batch1 = root.createBatch();
    batch1.render(1);

    // This batch has a later expiration time
    advanceCurrentTime(2000);
    const batch2 = root.createBatch();
    batch2.render(2);

    expect(container.textContent).toEqual('');

    batch2.commit();
    expect(container.textContent).toEqual('2');

    batch1.commit();
    jest.runAllTimers();
    expect(container.textContent).toEqual('1');
  });

  it('handles fatal errors triggered by batch.commit()', () => {
    const root = ReactDOM.unstable_createRoot(container);
    const batch = root.createBatch();
    const InvalidType = undefined;
    expect(() => batch.render(<InvalidType />)).toWarnDev(
      ['React.createElement: type is invalid'],
      {withoutStack: true},
    );
    expect(() => batch.commit()).toThrow('Element type is invalid');
  });

  it('throws a good message on invalid containers', () => {
    expect(() => {
      ReactDOM.unstable_createRoot(<div>Hi</div>);
    }).toThrow(
      'unstable_createRoot(...): Target container is not a DOM element.',
    );
  });

  it('warns when rendering with legacy API into createRoot() container', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    expect(() => {
      ReactDOM.render(<div>Bye</div>, container);
    }).toWarnDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.render() on a container that was previously ' +
          'passed to ReactDOM.unstable_createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element)?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        'Replacing React-rendered children with a new root component.',
      ],
      {withoutStack: true},
    );
    jest.runAllTimers();
    // This works now but we could disallow it:
    expect(container.textContent).toEqual('Bye');
  });

  it('warns when hydrating with legacy API into createRoot() container', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    expect(() => {
      ReactDOM.hydrate(<div>Hi</div>, container);
    }).toWarnDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.hydrate() on a container that was previously ' +
          'passed to ReactDOM.unstable_createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element, {hydrate: true})?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        'Replacing React-rendered children with a new root component.',
      ],
      {withoutStack: true},
    );
  });

  it('warns when unmounting with legacy API (no previous content)', () => {
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    let unmounted = false;
    expect(() => {
      unmounted = ReactDOM.unmountComponentAtNode(container);
    }).toWarnDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.unmountComponentAtNode() on a container that was previously ' +
          'passed to ReactDOM.unstable_createRoot(). This is not supported. Did you mean to call root.unmount()?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        "The node you're attempting to unmount was rendered by React and is not a top-level container.",
      ],
      {withoutStack: true},
    );
    expect(unmounted).toBe(false);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    jest.runAllTimers();
    expect(container.textContent).toEqual('');
  });

  it('warns when unmounting with legacy API (has previous content)', () => {
    // Currently createRoot().render() doesn't clear this.
    container.appendChild(document.createElement('div'));
    // The rest is the same as test above.
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<div>Hi</div>);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    let unmounted = false;
    expect(() => {
      unmounted = ReactDOM.unmountComponentAtNode(container);
    }).toWarnDev('Did you mean to call root.unmount()?', {withoutStack: true});
    expect(unmounted).toBe(false);
    jest.runAllTimers();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    jest.runAllTimers();
    expect(container.textContent).toEqual('');
  });

  it('warns when passing legacy container to createRoot()', () => {
    ReactDOM.render(<div>Hi</div>, container);
    expect(() => {
      ReactDOM.unstable_createRoot(container);
    }).toWarnDev(
      'You are calling ReactDOM.unstable_createRoot() on a container that was previously ' +
        'passed to ReactDOM.render(). This is not supported.',
      {withoutStack: true},
    );
  });
});
