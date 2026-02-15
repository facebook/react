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
let WebMCPInput;
let WebMCPSelect;
let WebMCPTextarea;

describe('WebMCP Declarative Input Components', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    const ReactWebMCP = require('react-webmcp');
    WebMCPInput = ReactWebMCP.WebMCPInput;
    WebMCPSelect = ReactWebMCP.WebMCPSelect;
    WebMCPTextarea = ReactWebMCP.WebMCPTextarea;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('WebMCPInput', () => {
    it('renders an input element', async () => {
      function App() {
        return React.createElement(WebMCPInput, {
          type: 'text',
          name: 'guest_name',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const input = container.querySelector('input');
      expect(input).not.toBe(null);
      expect(input.type).toBe('text');
      expect(input.name).toBe('guest_name');
    });

    it('sets toolparamtitle attribute', async () => {
      function App() {
        return React.createElement(WebMCPInput, {
          type: 'text',
          toolParamTitle: 'Guest Name',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const input = container.querySelector('input');
      expect(input.getAttribute('toolparamtitle')).toBe('Guest Name');
    });

    it('sets toolparamdescription attribute', async () => {
      function App() {
        return React.createElement(WebMCPInput, {
          type: 'text',
          toolParamDescription: 'Name of the guest making the reservation',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const input = container.querySelector('input');
      expect(input.getAttribute('toolparamdescription')).toBe(
        'Name of the guest making the reservation',
      );
    });

    it('sets both toolparamtitle and toolparamdescription', async () => {
      function App() {
        return React.createElement(WebMCPInput, {
          type: 'date',
          name: 'date',
          toolParamTitle: 'Date',
          toolParamDescription: 'Reservation date',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const input = container.querySelector('input');
      expect(input.getAttribute('toolparamtitle')).toBe('Date');
      expect(input.getAttribute('toolparamdescription')).toBe(
        'Reservation date',
      );
    });

    it('does not set attributes when not provided', async () => {
      function App() {
        return React.createElement(WebMCPInput, {
          type: 'text',
          name: 'plain',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const input = container.querySelector('input');
      expect(input.hasAttribute('toolparamtitle')).toBe(false);
      expect(input.hasAttribute('toolparamdescription')).toBe(false);
    });

    it('passes through standard HTML attributes', async () => {
      function App() {
        return React.createElement(WebMCPInput, {
          type: 'email',
          name: 'email',
          placeholder: 'Enter email',
          required: true,
          className: 'input-class',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const input = container.querySelector('input');
      expect(input.type).toBe('email');
      expect(input.name).toBe('email');
      expect(input.placeholder).toBe('Enter email');
      expect(input.required).toBe(true);
      expect(input.className).toBe('input-class');
    });
  });

  describe('WebMCPSelect', () => {
    it('renders a select element with children', async () => {
      function App() {
        return React.createElement(
          WebMCPSelect,
          {name: 'party_size'},
          React.createElement('option', {value: '1'}, '1'),
          React.createElement('option', {value: '2'}, '2'),
          React.createElement('option', {value: '3'}, '3'),
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const select = container.querySelector('select');
      expect(select).not.toBe(null);
      expect(select.name).toBe('party_size');
      expect(select.options).toHaveLength(3);
    });

    it('sets toolparamtitle attribute', async () => {
      function App() {
        return React.createElement(
          WebMCPSelect,
          {
            name: 'party_size',
            toolParamTitle: 'Party Size',
          },
          React.createElement('option', {value: '2'}, '2'),
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const select = container.querySelector('select');
      expect(select.getAttribute('toolparamtitle')).toBe('Party Size');
    });

    it('sets toolparamdescription attribute', async () => {
      function App() {
        return React.createElement(
          WebMCPSelect,
          {
            name: 'party_size',
            toolParamDescription: 'Number of guests',
          },
          React.createElement('option', {value: '2'}, '2'),
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const select = container.querySelector('select');
      expect(select.getAttribute('toolparamdescription')).toBe(
        'Number of guests',
      );
    });

    it('passes through standard HTML attributes', async () => {
      function App() {
        return React.createElement(
          WebMCPSelect,
          {
            name: 'seating',
            required: true,
            className: 'select-class',
          },
          React.createElement('option', {value: 'indoor'}, 'Indoor'),
          React.createElement('option', {value: 'outdoor'}, 'Outdoor'),
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const select = container.querySelector('select');
      expect(select.required).toBe(true);
      expect(select.className).toBe('select-class');
    });

    it('does not set attributes when not provided', async () => {
      function App() {
        return React.createElement(
          WebMCPSelect,
          {name: 'size'},
          React.createElement('option', {value: '1'}, '1'),
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const select = container.querySelector('select');
      expect(select.hasAttribute('toolparamtitle')).toBe(false);
      expect(select.hasAttribute('toolparamdescription')).toBe(false);
    });
  });

  describe('WebMCPTextarea', () => {
    it('renders a textarea element', async () => {
      function App() {
        return React.createElement(WebMCPTextarea, {
          name: 'notes',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const textarea = container.querySelector('textarea');
      expect(textarea).not.toBe(null);
      expect(textarea.name).toBe('notes');
    });

    it('sets toolparamtitle attribute', async () => {
      function App() {
        return React.createElement(WebMCPTextarea, {
          name: 'notes',
          toolParamTitle: 'Special Requests',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const textarea = container.querySelector('textarea');
      expect(textarea.getAttribute('toolparamtitle')).toBe('Special Requests');
    });

    it('sets toolparamdescription attribute', async () => {
      function App() {
        return React.createElement(WebMCPTextarea, {
          name: 'notes',
          toolParamDescription: 'Any dietary requirements or special occasions',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const textarea = container.querySelector('textarea');
      expect(textarea.getAttribute('toolparamdescription')).toBe(
        'Any dietary requirements or special occasions',
      );
    });

    it('passes through standard HTML attributes', async () => {
      function App() {
        return React.createElement(WebMCPTextarea, {
          name: 'notes',
          placeholder: 'Enter notes here...',
          rows: 5,
          className: 'textarea-class',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const textarea = container.querySelector('textarea');
      expect(textarea.placeholder).toBe('Enter notes here...');
      expect(textarea.rows).toBe(5);
      expect(textarea.className).toBe('textarea-class');
    });

    it('does not set attributes when not provided', async () => {
      function App() {
        return React.createElement(WebMCPTextarea, {
          name: 'notes',
        });
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(React.createElement(App));
      });

      const textarea = container.querySelector('textarea');
      expect(textarea.hasAttribute('toolparamtitle')).toBe(false);
      expect(textarea.hasAttribute('toolparamdescription')).toBe(false);
    });
  });
});
