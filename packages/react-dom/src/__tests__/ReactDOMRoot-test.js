/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var ReactDOMServer = require('react-dom/server');

const AsyncComponent = React.unstable_AsyncComponent;

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(container.textContent).toEqual('Hi');
  });

  it('unmounts children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    expect(container.textContent).toEqual('');
  });

  it('supports hydration', async () => {
    const markup = await new Promise(resolve =>
      resolve(
        ReactDOMServer.renderToString(<div><span className="extra" /></div>),
      ),
    );

    spyOn(console, 'error');

    // Does not hydrate by default
    const container1 = document.createElement('div');
    container1.innerHTML = markup;
    const root1 = ReactDOM.createRoot(container1);
    root1.render(<div><span /></div>);
    expect(console.error.calls.count()).toBe(0);

    // Accepts `hydrate` option
    const container2 = document.createElement('div');
    container2.innerHTML = markup;
    const root2 = ReactDOM.createRoot(container2, {hydrate: true});
    root2.render(<div><span /></div>);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toMatch('Extra attributes');
  });

  it('does not clear existing children', async () => {
    spyOn(console, 'error');
    container.innerHTML = '<div>a</div><div>b</div>';
    const root = ReactDOM.createRoot(container);
    root.render(<div><span>c</span><span>d</span></div>);
    expect(container.textContent).toEqual('abcd');
    root.render(<div><span>d</span><span>c</span></div>);
    expect(container.textContent).toEqual('abdc');
  });

  it('can defer commit using prerender', () => {
    const root = ReactDOM.createRoot(container);
    const work = root.prerender(<div>Hi</div>);
    // Hasn't updated yet
    expect(container.textContent).toEqual('');
    // Flush work
    work.commit();
    expect(container.textContent).toEqual('Hi');
  });

  it("does not restart a blocked root that wasn't updated", () => {
    let ops = [];
    function Foo(props) {
      ops.push('Foo');
      return props.children;
    }
    const root = ReactDOM.createRoot(container);
    const work = root.prerender(<Foo>Hi</Foo>);
    expect(ops).toEqual(['Foo']);
    // Hasn't updated yet
    expect(container.textContent).toEqual('');

    ops = [];

    // Flush work. Shouldn't re-render Foo.
    work.commit();
    expect(ops).toEqual([]);
    expect(container.textContent).toEqual('Hi');
  });

  it('can wait for prerender to finish', () => {
    const Async = React.unstable_AsyncComponent;
    const root = ReactDOM.createRoot(container);
    const work = root.prerender(<Async>Foo</Async>);

    // Hasn't updated yet
    expect(container.textContent).toEqual('');

    let ops = [];
    work.then(() => {
      // Still hasn't updated
      ops.push(container.textContent);
      // Should synchronously commit
      work.commit();
      ops.push(container.textContent);
    });
    // Flush async work
    jest.runAllTimers();
    expect(ops).toEqual(['', 'Foo']);
  });

  it('resolves `then` callback synchronously if update is sync', () => {
    const root = ReactDOM.createRoot(container);
    const work = root.prerender(<div>Hi</div>);

    let ops = [];
    work.then(() => {
      work.commit();
      ops.push(container.textContent);
      expect(container.textContent).toEqual('Hi');
    });
    // `then` should have synchronously resolved
    expect(ops).toEqual(['Hi']);
  });

  it('resolves `then` callback if tree already completed', () => {
    const root = ReactDOM.createRoot(container);
    const work = root.prerender(<div>Hi</div>);

    let ops = [];
    work.then(() => {
      work.commit();
      ops.push(container.textContent);
      expect(container.textContent).toEqual('Hi');
    });

    work.then(() => {
      ops.push('Second callback');
    });

    // `then` should have synchronously resolved
    expect(ops).toEqual(['Hi', 'Second callback']);
  });

  it('commits an earlier time without unblocking a later time', () => {
    const root = ReactDOM.createRoot(container);
    // Sync update
    const work1 = root.prerender(<div>a</div>);
    // Async update
    const work2 = root.prerender(<AsyncComponent>b</AsyncComponent>);
    // Flush only the sync update
    work1.commit();
    jest.runAllTimers();
    expect(container.textContent).toBe('a');
    // Now flush the async update
    work2.commit();
    expect(container.textContent).toBe('b');
  });

  it('render returns a work object, too', () => {
    const root = ReactDOM.createRoot(container);
    const work = root.render(<div>Hello</div>);
    let ops = [];
    work.then(() => {
      // Work already committed.
      ops.push(container.textContent);
    });
    expect(container.textContent).toEqual('Hello');
  });
});
