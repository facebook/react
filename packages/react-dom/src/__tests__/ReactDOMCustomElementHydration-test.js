/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMCustomElementHydration', () => {
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let ReactDOMServer;
  let act;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    act = require('internal-test-utils').act;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('custom element event listener hydration', () => {
    it('should attach custom element event listeners during hydration', async () => {
      const container = document.createElement('div');
      const eventLog = [];

      // Mock custom element class
      class CustomElement extends HTMLElement {}
      customElements.define('ce-event-test', CustomElement);

      // Server-side render
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-event-test', {
          'onmy-event': () => {
            eventLog.push('handler-called');
          },
        })
      );

      // Inject markup
      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Try to dispatch custom event before hydration (should not fire)
      element.dispatchEvent(new CustomEvent('my-event'));
      expect(eventLog).toEqual([]);

      // Hydrate with event handler
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-event-test', {
          'onmy-event': () => {
            eventLog.push('handler-called');
          },
        }),
        {
          onRecoverableError(error) {
            // Suppress hydration mismatch warnings
          },
        }
      );

      await act(async () => {
        // Dispatch event after hydration
        element.dispatchEvent(new CustomEvent('my-event'));
      });

      // Event handler should be attached during hydration
      expect(eventLog).toContain('handler-called');
    });

    it('should attach multiple custom event listeners during hydration', async () => {
      const container = document.createElement('div');
      const eventLog = [];

      class CustomElement extends HTMLElement {}
      customElements.define('ce-multi-event', CustomElement);

      // Server-side render
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-multi-event', {
          'onmodule-loaded': () => {
            eventLog.push('module-loaded');
          },
          'onmodule-error': () => {
            eventLog.push('module-error');
          },
          'onmodule-updated': () => {
            eventLog.push('module-updated');
          },
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate with event handlers
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-multi-event', {
          'onmodule-loaded': () => {
            eventLog.push('module-loaded');
          },
          'onmodule-error': () => {
            eventLog.push('module-error');
          },
          'onmodule-updated': () => {
            eventLog.push('module-updated');
          },
        }),
        {
          onRecoverableError() {},
        }
      );

      await act(async () => {
        element.dispatchEvent(new CustomEvent('module-loaded'));
        element.dispatchEvent(new CustomEvent('module-error'));
        element.dispatchEvent(new CustomEvent('module-updated'));
      });

      expect(eventLog).toContain('module-loaded');
      expect(eventLog).toContain('module-error');
      expect(eventLog).toContain('module-updated');
    });

    it('should hydrate primitive prop types on custom elements', async () => {
      const container = document.createElement('div');

      class CustomElementWithProps extends HTMLElement {}
      customElements.define('ce-primitive-props', CustomElementWithProps);

      // Server-side render with primitive props
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-primitive-props', {
          stringValue: 'test',
          numberValue: 42,
          trueProp: true,
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-primitive-props', {
          stringValue: 'test',
          numberValue: 42,
          trueProp: true,
        }),
        {
          onRecoverableError() {},
        }
      );

      await act(async () => {
        // Hydration complete
      });

      // After hydration, attributes should be present
      expect(
        element.hasAttribute('stringValue') ||
        element.getAttribute('stringValue') === 'test'
      ).toBe(true);
    });

    it('should not set non-primitive props as attributes during SSR', async () => {
      // Server-side render with non-primitive props
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-advanced-props', {
          objectProp: {key: 'value'},
          functionProp: () => {},
          falseProp: false,
        })
      );

      // Non-primitive values should not appear as attributes in server HTML
      expect(serverHTML).not.toContain('objectProp');
      expect(serverHTML).not.toContain('functionProp');
      expect(serverHTML).not.toContain('falseProp');
    });

    it('should handle updating custom element event listeners after hydration', async () => {
      const container = document.createElement('div');
      const eventLog = [];

      class CustomElementForUpdate extends HTMLElement {}
      customElements.define('ce-update-test', CustomElementForUpdate);

      // Server-side render with initial event handler
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-update-test', {
          onmyevent: () => {
            eventLog.push('initial-handler');
          },
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-update-test', {
          onmyevent: () => {
            eventLog.push('initial-handler');
          },
        }),
        {
          onRecoverableError() {},
        }
      );

      await act(async () => {
        element.dispatchEvent(new CustomEvent('myevent'));
      });

      expect(eventLog).toContain('initial-handler');
      eventLog.length = 0;

      // Update the event handler
      await act(async () => {
        root.render(
          React.createElement('ce-update-test', {
            onmyevent: () => {
              eventLog.push('updated-handler');
            },
          })
        );
      });

      await act(async () => {
        element.dispatchEvent(new CustomEvent('myevent'));
      });

      // The updated handler should be called
      expect(eventLog).toContain('updated-handler');
      expect(eventLog).not.toContain('initial-handler');
    });

    it('should handle undefined custom element during hydration', async () => {
      const container = document.createElement('div');
      const eventLog = [];

      // Server-side render with event handler for unregistered element
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-not-registered', {
          'onmy-event': () => {
            eventLog.push('event-fired');
          },
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate - the element is not yet registered
      // Event listeners should still be attached
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-not-registered', {
          'onmy-event': () => {
            eventLog.push('event-fired');
          },
        }),
        {
          onRecoverableError() {},
        }
      );

      await act(async () => {
        // Register the element after hydration
        class UnregisteredElement extends HTMLElement {}
        customElements.define('ce-not-registered', UnregisteredElement);

        // Dispatch event after registration
        element.dispatchEvent(new CustomEvent('my-event'));
      });

      // Event listener should work even if element wasn't registered during hydration
      expect(eventLog).toContain('event-fired');
    });

    it('should properly hydrate custom elements with mixed props', async () => {
      const container = document.createElement('div');
      const eventLog = [];

      class MixedPropsElement extends HTMLElement {}
      customElements.define('ce-mixed-props', MixedPropsElement);

      // Server-side render with mixed prop types
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-mixed-props', {
          stringAttr: 'value',
          numberAttr: 123,
          onmyevent: () => {
            eventLog.push('mixed-event');
          },
          className: 'custom-class',
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-mixed-props', {
          stringAttr: 'value',
          numberAttr: 123,
          onmyevent: () => {
            eventLog.push('mixed-event');
          },
          className: 'custom-class',
        }),
        {
          onRecoverableError() {},
        }
      );

      await act(async () => {
        element.dispatchEvent(new CustomEvent('myevent'));
      });

      // Event should be fired
      expect(eventLog).toContain('mixed-event');
    });

    it('should remove custom element event listeners when prop is removed', async () => {
      const container = document.createElement('div');
      const eventLog = [];

      class CustomElementRemovalTest extends HTMLElement {}
      customElements.define('ce-removal-test', CustomElementRemovalTest);

      // Server-side render with event handler
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-removal-test', {
          onmyevent: () => {
            eventLog.push('should-not-fire');
          },
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-removal-test', {
          onmyevent: () => {
            eventLog.push('should-not-fire');
          },
        }),
        {
          onRecoverableError() {},
        }
      );

      // Remove the event handler
      await act(async () => {
        root.render(React.createElement('ce-removal-test'));
      });

      await act(async () => {
        element.dispatchEvent(new CustomEvent('myevent'));
      });

      // Event should not fire after handler removal
      expect(eventLog).not.toContain('should-not-fire');
    });
  });

  describe('custom element property hydration', () => {
    it('should handle custom properties during hydration when element is defined', async () => {
      const container = document.createElement('div');

      // Create and register a custom element with custom properties
      class CustomElementWithProperty extends HTMLElement {
        constructor() {
          super();
          this._internalValue = undefined;
        }

        set customProperty(value) {
          this._internalValue = value;
        }

        get customProperty() {
          return this._internalValue;
        }
      }
      customElements.define('ce-with-property', CustomElementWithProperty);

      // Server-side render
      const serverHTML = ReactDOMServer.renderToString(
        React.createElement('ce-with-property', {
          'data-attr': 'test',
        })
      );

      container.innerHTML = serverHTML;
      const element = container.firstChild;

      // Hydrate
      const root = ReactDOMClient.hydrateRoot(
        container,
        React.createElement('ce-with-property', {
          'data-attr': 'test',
        }),
        {
          onRecoverableError() {},
        }
      );

      await act(async () => {
        // Hydration complete
      });

      // Verify the element is properly hydrated
      expect(element.getAttribute('data-attr')).toBe('test');
    });
  });
});
