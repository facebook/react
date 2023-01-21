/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMNestedEvents', () => {
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let Scheduler;
  let act;
  let useState;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    useState = React.useState;
  });

  it('nested event dispatches should not cause updates to flush', async () => {
    const buttonRef = React.createRef(null);
    function App() {
      const [isClicked, setIsClicked] = useState(false);
      const [isFocused, setIsFocused] = useState(false);
      const onClick = () => {
        setIsClicked(true);
        const el = buttonRef.current;
        el.focus();
        // The update triggered by the focus event should not have flushed yet.
        // Nor the click update. They would have if we had wrapped the focus
        // call in `flushSync`, though.
        Scheduler.unstable_yieldValue(
          'Value right after focus call: ' + el.innerHTML,
        );
      };
      const onFocus = () => {
        setIsFocused(true);
      };
      return (
        <>
          <button ref={buttonRef} onFocus={onFocus} onClick={onClick}>
            {`Clicked: ${isClicked}, Focused: ${isFocused}`}
          </button>
        </>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
    expect(buttonRef.current.innerHTML).toEqual(
      'Clicked: false, Focused: false',
    );

    await act(async () => {
      buttonRef.current.click();
    });
    expect(Scheduler).toHaveYielded([
      'Value right after focus call: Clicked: false, Focused: false',
    ]);
    expect(buttonRef.current.innerHTML).toEqual('Clicked: true, Focused: true');
  });

  it('custom events inside a discrete event is batched with sync updates and flushed synchronously', async () => {
    const buttonRef = React.createRef(null);
    function App() {
      const [isClicked, setIsClicked] = useState(false);
      const [isCustom, setIsCustom] = useState(false);
      const onClick = () => {
        setIsClicked(true);
        buttonRef.current.dispatchEvent(new Event('custom'));
      };
      const onCustomEvent = () => {
        setIsCustom(true);
      };
      React.useEffect(() => {
        buttonRef.current.addEventListener('click', onClick);
        buttonRef.current.addEventListener('custom', onCustomEvent);
      }, []);
      Scheduler.unstable_yieldValue(`render: ${isClicked} / ${isCustom}`);
      return <button ref={buttonRef} />;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['render: false / false']);

    await act(async () => {
      buttonRef.current.click();
    });
    expect(Scheduler).toHaveYielded(['render: true / true']);
  });

  // This just exists to assert the Jest behavior. Once it has the expected behavior,
  // this and related mocks can be deleted in this file
  it('jest does not have the right `window.event` in queueMicrotask', () => {
    const btn = document.createElement('button');
    const customEvent = new CustomEvent('custom');
    btn.addEventListener('custom', () => {
      queueMicrotask(() => {
        // This should be 'click'
        expect(window.event).toBe(undefined);
      });
    });
    btn.addEventListener('click', () => {
      btn.dispatchEvent(customEvent);
    });

    btn.click();
  });

  it('custom events inside a discrete event flushes synchronously', async () => {
    const buttonRef = React.createRef(null);

    // Mock the browser behavior on setting `window.event` in microtasks
    let outterEvent;

    function App() {
      const [isCustom, setIsCustom] = useState(false);
      const onClick = () => {
        outterEvent = window.event;
        const customEvent = new Event('custom');
        buttonRef.current.dispatchEvent(customEvent);
        queueMicrotask(() => {
          window.event = undefined;
        });
      };
      const onCustomEvent = () => {
        // In the microtask, `window.event` should be the outter click event
        queueMicrotask(() => {
          window.event = outterEvent;
        });
        setIsCustom(true);
      };
      React.useEffect(() => {
        buttonRef.current.addEventListener('custom', onCustomEvent);
        buttonRef.current.addEventListener('click', onClick);
      }, []);
      Scheduler.unstable_yieldValue(`render: ${isCustom}`);
      return <button ref={buttonRef} />;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['render: false']);

    await act(async () => {
      buttonRef.current.click();
      queueMicrotask(() => {
        Scheduler.unstable_yieldValue('Sync');
      });
      Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_ImmediatePriority,
        () => {
          Scheduler.unstable_yieldValue('Immediate');
        },
      );
    });
    // The custom update should happens synchronously before yielding 'Immediate' 
    expect(Scheduler).toHaveYielded(['render: true', 'Sync', 'Immediate']);
  });

  it('custom events inside other events keeps the default priority', async () => {
    const buttonRef = React.createRef(null);

    function App() {
      const [isCustom, setIsCustom] = useState(false);
      const onClick = () => {
        buttonRef.current.dispatchEvent(new Event('custom'));
      };
      const onCustomEvent = () => {
        setIsCustom(true);
      };
      React.useEffect(() => {
        buttonRef.current.addEventListener('custom', onCustomEvent);
        buttonRef.current.addEventListener('mouseover', onClick);
      }, []);
      Scheduler.unstable_yieldValue(`render: ${isCustom}`);
      return <button ref={buttonRef} />;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['render: false']);

    await act(async () => {
      buttonRef.current.dispatchEvent(new Event('mouseover', {bubbles: true}));
      Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_UserBlockingPriority,
        () => {
          Scheduler.unstable_yieldValue('Continuous');
        },
      );
      Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_NormalPriority,
        () => {
          Scheduler.unstable_yieldValue('Default');
        },
      );
    });
    // The custom update should happens with the default priority
    expect(Scheduler).toHaveYielded(['Continuous', 'render: true', 'Default']);
  });
});
