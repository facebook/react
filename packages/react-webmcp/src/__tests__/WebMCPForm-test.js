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
let ReactDOMClient;
let act;
let WebMCPForm;

describe('WebMCPForm', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    WebMCPForm = require('react-webmcp').WebMCPForm;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders a form element', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
        },
        React.createElement('input', {type: 'text', name: 'name'}),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form).not.toBe(null);
  });

  it('sets the toolname attribute', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'make-reservation',
          toolDescription: 'Make a reservation',
        },
        React.createElement('span', null, 'Content'),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.getAttribute('toolname')).toBe('make-reservation');
  });

  it('sets the tooldescription attribute', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Book a table at our restaurant',
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.getAttribute('tooldescription')).toBe(
      'Book a table at our restaurant',
    );
  });

  it('sets toolautosubmit attribute when true', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          toolAutoSubmit: true,
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.hasAttribute('toolautosubmit')).toBe(true);
  });

  it('does NOT set toolautosubmit when false or omitted', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          toolAutoSubmit: false,
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.hasAttribute('toolautosubmit')).toBe(false);
  });

  it('passes through className', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          className: 'my-form-class',
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.className).toBe('my-form-class');
  });

  it('passes through id', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          id: 'reservation-form',
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.id).toBe('reservation-form');
  });

  it('renders children inside the form', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
        },
        React.createElement('input', {type: 'text', name: 'guest_name'}),
        React.createElement('button', {type: 'submit'}, 'Submit'),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    const input = form.querySelector('input[name="guest_name"]');
    const button = form.querySelector('button[type="submit"]');
    expect(input).not.toBe(null);
    expect(button).not.toBe(null);
    expect(button.textContent).toBe('Submit');
  });

  it('calls onSubmit handler with the native event', async () => {
    const onSubmit = jest.fn(e => e.preventDefault());

    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          onSubmit: onSubmit,
        },
        React.createElement('button', {type: 'submit'}, 'Go'),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    await act(() => {
      form.dispatchEvent(
        new Event('submit', {bubbles: true, cancelable: true}),
      );
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('fires onToolActivated callback on toolactivated event', async () => {
    const onToolActivated = jest.fn();

    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          onToolActivated: onToolActivated,
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // Dispatch toolactivated event with matching toolName
    await act(() => {
      const event = new Event('toolactivated');
      event.toolName = 'reservation';
      window.dispatchEvent(event);
    });

    expect(onToolActivated).toHaveBeenCalledTimes(1);
    expect(onToolActivated).toHaveBeenCalledWith('reservation');
  });

  it('does NOT fire onToolActivated for a different tool name', async () => {
    const onToolActivated = jest.fn();

    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          onToolActivated: onToolActivated,
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // Dispatch for a different tool
    await act(() => {
      const event = new Event('toolactivated');
      event.toolName = 'other-tool';
      window.dispatchEvent(event);
    });

    expect(onToolActivated).not.toHaveBeenCalled();
  });

  it('fires onToolCancel callback on toolcancel event', async () => {
    const onToolCancel = jest.fn();

    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          onToolCancel: onToolCancel,
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    await act(() => {
      const event = new Event('toolcancel');
      event.toolName = 'reservation';
      window.dispatchEvent(event);
    });

    expect(onToolCancel).toHaveBeenCalledTimes(1);
    expect(onToolCancel).toHaveBeenCalledWith('reservation');
  });

  it('passes through noValidate', async () => {
    function App() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          noValidate: true,
        },
        null,
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const form = container.querySelector('form');
    expect(form.noValidate).toBe(true);
  });

  it('cleans up event listeners on unmount', async () => {
    const onToolActivated = jest.fn();

    function FormComponent() {
      return React.createElement(
        WebMCPForm,
        {
          toolName: 'reservation',
          toolDescription: 'Make a reservation',
          onToolActivated: onToolActivated,
        },
        null,
      );
    }

    function App({show}) {
      if (show) {
        return React.createElement(FormComponent);
      }
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {show: true}));
    });

    // Unmount
    await act(() => {
      root.render(React.createElement(App, {show: false}));
    });

    // Should NOT trigger after unmount
    await act(() => {
      const event = new Event('toolactivated');
      event.toolName = 'reservation';
      window.dispatchEvent(event);
    });

    expect(onToolActivated).not.toHaveBeenCalled();
  });
});
