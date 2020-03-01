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
let Scheduler = require('scheduler');

describe('ReactDOMRoot', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
  });

  if (!__EXPERIMENTAL__) {
    it('createRoot is not exposed in stable build', () => {
      expect(ReactDOM.createRoot).toBe(undefined);
    });
    return;
  }

  it('renders children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
  });

  it('warns if a callback parameter is provided to render', () => {
    const callback = jest.fn();
    const root = ReactDOM.createRoot(container);
    expect(() =>
      root.render(<div>Hi</div>, callback),
    ).toErrorDev(
      'render(...): does not support the second callback argument. ' +
        'To execute a side effect after rendering, declare it in a component body with useEffect().',
      {withoutStack: true},
    );
    Scheduler.unstable_flushAll();
    expect(callback).not.toHaveBeenCalled();
  });

  it('warns if a callback parameter is provided to unmount', () => {
    const callback = jest.fn();
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    expect(() =>
      root.unmount(callback),
    ).toErrorDev(
      'unmount(...): does not support a callback argument. ' +
        'To execute a side effect after rendering, declare it in a component body with useEffect().',
      {withoutStack: true},
    );
    Scheduler.unstable_flushAll();
    expect(callback).not.toHaveBeenCalled();
  });

  it('unmounts children', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('');
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
    const root1 = ReactDOM.createRoot(container1);
    root1.render(
      <div>
        <span />
      </div>,
    );
    Scheduler.unstable_flushAll();

    // Accepts `hydrate` option
    const container2 = document.createElement('div');
    container2.innerHTML = markup;
    const root2 = ReactDOM.createRoot(container2, {hydrate: true});
    root2.render(
      <div>
        <span />
      </div>,
    );
    expect(() => Scheduler.unstable_flushAll()).toErrorDev('Extra attributes');
  });

  it('does not clear existing children', async () => {
    container.innerHTML = '<div>a</div><div>b</div>';
    const root = ReactDOM.createRoot(container);
    root.render(
      <div>
        <span>c</span>
        <span>d</span>
      </div>,
    );
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('abcd');
    root.render(
      <div>
        <span>d</span>
        <span>c</span>
      </div>,
    );
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('abdc');
  });

  it('throws a good message on invalid containers', () => {
    expect(() => {
      ReactDOM.createRoot(<div>Hi</div>);
    }).toThrow('createRoot(...): Target container is not a DOM element.');
  });

  it('warns when rendering with legacy API into createRoot() container', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    expect(() => {
      ReactDOM.render(<div>Bye</div>, container);
    }).toErrorDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.render() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. ' +
          'Did you mean to call root.render(element)?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        'Replacing React-rendered children with a new root component.',
      ],
      {withoutStack: true},
    );
    Scheduler.unstable_flushAll();
    // This works now but we could disallow it:
    expect(container.textContent).toEqual('Bye');
  });

  it('warns when hydrating with legacy API into createRoot() container', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    expect(() => {
      ReactDOM.hydrate(<div>Hi</div>, container);
    }).toErrorDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.hydrate() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. ' +
          'Did you mean to call createRoot(container, {hydrate: true}).render(element)?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        'Replacing React-rendered children with a new root component.',
      ],
      {withoutStack: true},
    );
  });

  it('warns when unmounting with legacy API (no previous content)', () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    let unmounted = false;
    expect(() => {
      unmounted = ReactDOM.unmountComponentAtNode(container);
    }).toErrorDev(
      [
        // We care about this warning:
        'You are calling ReactDOM.unmountComponentAtNode() on a container that was previously ' +
          'passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?',
        // This is more of a symptom but restructuring the code to avoid it isn't worth it:
        "The node you're attempting to unmount was rendered by React and is not a top-level container.",
      ],
      {withoutStack: true},
    );
    expect(unmounted).toBe(false);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('');
  });

  it('warns when unmounting with legacy API (has previous content)', () => {
    // Currently createRoot().render() doesn't clear this.
    container.appendChild(document.createElement('div'));
    // The rest is the same as test above.
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    let unmounted = false;
    expect(() => {
      unmounted = ReactDOM.unmountComponentAtNode(container);
    }).toErrorDev('Did you mean to call root.unmount()?', {withoutStack: true});
    expect(unmounted).toBe(false);
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('Hi');
    root.unmount();
    Scheduler.unstable_flushAll();
    expect(container.textContent).toEqual('');
  });

  it('warns when passing legacy container to createRoot()', () => {
    ReactDOM.render(<div>Hi</div>, container);
    expect(() => {
      ReactDOM.createRoot(container);
    }).toErrorDev(
      'You are calling ReactDOM.createRoot() on a container that was previously ' +
        'passed to ReactDOM.render(). This is not supported.',
      {withoutStack: true},
    );
  });

  it('warns when creating two roots managing the same container', () => {
    ReactDOM.createRoot(container);
    expect(() => {
      ReactDOM.createRoot(container);
    }).toErrorDev(
      'You are calling ReactDOM.createRoot() on a container that ' +
        'has already been passed to createRoot() before. Instead, call ' +
        'root.render() on the existing root instead if you want to update it.',
      {withoutStack: true},
    );
  });

  it('does not warn when creating second root after first one is unmounted', () => {
    const root = ReactDOM.createRoot(container);
    root.unmount();
    Scheduler.unstable_flushAll();
    ReactDOM.createRoot(container); // No warning
  });

  it('warns if creating a root on the document.body', async () => {
    expect(() => {
      ReactDOM.createRoot(document.body);
    }).toErrorDev(
      'createRoot(): Creating roots directly with document.body is ' +
        'discouraged, since its children are often manipulated by third-party ' +
        'scripts and browser extensions. This may lead to subtle ' +
        'reconciliation issues. Try using a container element created ' +
        'for your app.',
      {withoutStack: true},
    );
  });

  it('warns if updating a root that has had its contents removed', async () => {
    const root = ReactDOM.createRoot(container);
    root.render(<div>Hi</div>);
    Scheduler.unstable_flushAll();
    container.innerHTML = '';

    expect(() => {
      root.render(<div>Hi</div>);
    }).toErrorDev(
      'render(...): It looks like the React-rendered content of the ' +
        'root container was removed without using React. This is not ' +
        'supported and will cause errors. Instead, call ' +
        "root.unmount() to empty a root's container.",
      {withoutStack: true},
    );
  });
});
