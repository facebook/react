/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Set by `yarn test-fire`.
const {disableInputAttributeSyncing} = require('shared/ReactFeatureFlags');

describe('DOMPropertyOperations', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  describe('setValueForProperty', () => {
    it('should set values as properties by default', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div title="Tip!" />, container);
      expect(container.firstChild.title).toBe('Tip!');
    });

    it('should set values as attributes if necessary', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div role="#" />, container);
      expect(container.firstChild.getAttribute('role')).toBe('#');
      expect(container.firstChild.role).toBeUndefined();
    });

    it('should set values as namespace attributes if necessary', () => {
      const container = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      ReactDOM.render(<image xlinkHref="about:blank" />, container);
      expect(
        container.firstChild.getAttributeNS(
          'http://www.w3.org/1999/xlink',
          'href',
        ),
      ).toBe('about:blank');
    });

    it('should set values as boolean properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div disabled="disabled" />, container);
      expect(container.firstChild.getAttribute('disabled')).toBe('');
      ReactDOM.render(<div disabled={true} />, container);
      expect(container.firstChild.getAttribute('disabled')).toBe('');
      ReactDOM.render(<div disabled={false} />, container);
      expect(container.firstChild.getAttribute('disabled')).toBe(null);
      ReactDOM.render(<div disabled={true} />, container);
      ReactDOM.render(<div disabled={null} />, container);
      expect(container.firstChild.getAttribute('disabled')).toBe(null);
      ReactDOM.render(<div disabled={true} />, container);
      ReactDOM.render(<div disabled={undefined} />, container);
      expect(container.firstChild.getAttribute('disabled')).toBe(null);
    });

    it('should convert attribute values to string first', () => {
      // Browsers default to this behavior, but some test environments do not.
      // This ensures that we have consistent behavior.
      const obj = {
        toString: function() {
          return 'css-class';
        },
      };

      const container = document.createElement('div');
      ReactDOM.render(<div className={obj} />, container);
      expect(container.firstChild.getAttribute('class')).toBe('css-class');
    });

    it('should not remove empty attributes for special input properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<input value="" onChange={() => {}} />, container);
      if (disableInputAttributeSyncing) {
        expect(container.firstChild.hasAttribute('value')).toBe(false);
      } else {
        expect(container.firstChild.getAttribute('value')).toBe('');
      }
      expect(container.firstChild.value).toBe('');
    });

    it('should not remove empty attributes for special option properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <select>
          <option value="">empty</option>
          <option>filled</option>
        </select>,
        container,
      );
      // Regression test for https://github.com/facebook/react/issues/6219
      expect(container.firstChild.firstChild.value).toBe('');
      expect(container.firstChild.lastChild.value).toBe('filled');
    });

    it('should remove for falsey boolean properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div allowFullScreen={false} />, container);
      expect(container.firstChild.hasAttribute('allowFullScreen')).toBe(false);
    });

    it('should remove when setting custom attr to null', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div data-foo="bar" />, container);
      expect(container.firstChild.hasAttribute('data-foo')).toBe(true);
      ReactDOM.render(<div data-foo={null} />, container);
      expect(container.firstChild.hasAttribute('data-foo')).toBe(false);
    });

    it('should set className to empty string instead of null', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div className="selected" />, container);
      expect(container.firstChild.className).toBe('selected');
      ReactDOM.render(<div className={null} />, container);
      // className should be '', not 'null' or null (which becomes 'null' in
      // some browsers)
      expect(container.firstChild.className).toBe('');
      expect(container.firstChild.getAttribute('class')).toBe(null);
    });

    it('should remove property properly for boolean properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div hidden={true} />, container);
      expect(container.firstChild.hasAttribute('hidden')).toBe(true);
      ReactDOM.render(<div hidden={false} />, container);
      expect(container.firstChild.hasAttribute('hidden')).toBe(false);
    });

    it('should always assign the value attribute for non-inputs', function() {
      const container = document.createElement('div');
      ReactDOM.render(<progress />, container);
      spyOnDevAndProd(container.firstChild, 'setAttribute');
      ReactDOM.render(<progress value={30} />, container);
      ReactDOM.render(<progress value="30" />, container);
      expect(container.firstChild.setAttribute).toHaveBeenCalledTimes(2);
    });

    it('should return the progress to intermediate state on null value', () => {
      const container = document.createElement('div');
      ReactDOM.render(<progress value={30} />, container);
      ReactDOM.render(<progress value={null} />, container);
      // Ensure we move progress back to an indeterminate state.
      // Regression test for https://github.com/facebook/react/issues/6119
      expect(container.firstChild.hasAttribute('value')).toBe(false);
    });

    // @gate enableCustomElementPropertySupport
    it('custom element custom events lowercase', () => {
      const oncustomevent = jest.fn();
      function Test() {
        return <my-custom-element oncustomevent={oncustomevent} />;
      }
      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      container
        .querySelector('my-custom-element')
        .dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
    });

    // @gate enableCustomElementPropertySupport
    it('custom element custom events uppercase', () => {
      const oncustomevent = jest.fn();
      function Test() {
        return <my-custom-element onCustomevent={oncustomevent} />;
      }
      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      container
        .querySelector('my-custom-element')
        .dispatchEvent(new Event('Customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
    });

    // @gate enableCustomElementPropertySupport
    it('custom element custom event with dash in name', () => {
      const oncustomevent = jest.fn();
      function Test() {
        return <my-custom-element oncustom-event={oncustomevent} />;
      }
      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      container
        .querySelector('my-custom-element')
        .dispatchEvent(new Event('custom-event'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
    });

    // @gate enableCustomElementPropertySupport
    it('custom element remove event handler', () => {
      const oncustomevent = jest.fn();
      function Test(props) {
        return <my-custom-element oncustomevent={props.handler} />;
      }

      const container = document.createElement('div');
      ReactDOM.render(<Test handler={oncustomevent} />, container);
      const customElement = container.querySelector('my-custom-element');
      customElement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);

      ReactDOM.render(<Test handler={false} />, container);
      // Make sure that the second render didn't create a new element. We want
      // to make sure removeEventListener actually gets called on the same element.
      expect(customElement).toBe(customElement);
      customElement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);

      ReactDOM.render(<Test handler={oncustomevent} />, container);
      customElement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(2);

      const oncustomevent2 = jest.fn();
      ReactDOM.render(<Test handler={oncustomevent2} />, container);
      customElement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(2);
      expect(oncustomevent2).toHaveBeenCalledTimes(1);
    });

    it('custom elements shouldnt have non-functions for on* attributes treated as event listeners', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <my-custom-element
          onstring={'hello'}
          onobj={{hello: 'world'}}
          onarray={['one', 'two']}
          ontrue={true}
          onfalse={false}
        />,
        container,
      );
      const customElement = container.querySelector('my-custom-element');
      expect(customElement.getAttribute('onstring')).toBe('hello');
      expect(customElement.getAttribute('onobj')).toBe('[object Object]');
      expect(customElement.getAttribute('onarray')).toBe('one,two');
      expect(customElement.getAttribute('ontrue')).toBe('true');
      expect(customElement.getAttribute('onfalse')).toBe('false');

      // Dispatch the corresponding event names to make sure that nothing crashes.
      customElement.dispatchEvent(new Event('string'));
      customElement.dispatchEvent(new Event('obj'));
      customElement.dispatchEvent(new Event('array'));
      customElement.dispatchEvent(new Event('true'));
      customElement.dispatchEvent(new Event('false'));
    });

    it('custom elements should still have onClick treated like regular elements', () => {
      let syntheticClickEvent = null;
      const syntheticEventHandler = jest.fn(
        event => (syntheticClickEvent = event),
      );
      let nativeClickEvent = null;
      const nativeEventHandler = jest.fn(event => (nativeClickEvent = event));
      function Test() {
        return <my-custom-element onClick={syntheticEventHandler} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      ReactDOM.render(<Test />, container);

      const customElement = container.querySelector('my-custom-element');
      customElement.onclick = nativeEventHandler;
      container.querySelector('my-custom-element').click();

      expect(nativeEventHandler).toHaveBeenCalledTimes(1);
      expect(syntheticEventHandler).toHaveBeenCalledTimes(1);
      expect(syntheticClickEvent.nativeEvent).toBe(nativeClickEvent);
    });

    // @gate enableCustomElementPropertySupport
    it('custom elements should allow custom events with capture event listeners', () => {
      const oncustomeventCapture = jest.fn();
      const oncustomevent = jest.fn();
      function Test() {
        return (
          <my-custom-element
            oncustomeventCapture={oncustomeventCapture}
            oncustomevent={oncustomevent}>
            <div />
          </my-custom-element>
        );
      }
      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      container
        .querySelector('my-custom-element > div')
        .dispatchEvent(new Event('customevent', {bubbles: false}));
      expect(oncustomeventCapture).toHaveBeenCalledTimes(1);
      expect(oncustomevent).toHaveBeenCalledTimes(0);
    });

    it('innerHTML should not work on custom elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<my-custom-element innerHTML="foo" />, container);
      const customElement = container.querySelector('my-custom-element');
      expect(customElement.getAttribute('innerHTML')).toBe(null);
      expect(customElement.hasChildNodes()).toBe(false);

      // Render again to verify the update codepath doesn't accidentally let
      // something through.
      ReactDOM.render(<my-custom-element innerHTML="bar" />, container);
      expect(customElement.getAttribute('innerHTML')).toBe(null);
      expect(customElement.hasChildNodes()).toBe(false);
    });

    // @gate enableCustomElementPropertySupport
    it('innerText should not work on custom elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<my-custom-element innerText="foo" />, container);
      const customElement = container.querySelector('my-custom-element');
      expect(customElement.getAttribute('innerText')).toBe(null);
      expect(customElement.hasChildNodes()).toBe(false);

      // Render again to verify the update codepath doesn't accidentally let
      // something through.
      ReactDOM.render(<my-custom-element innerText="bar" />, container);
      expect(customElement.getAttribute('innerText')).toBe(null);
      expect(customElement.hasChildNodes()).toBe(false);
    });

    // @gate enableCustomElementPropertySupport
    it('textContent should not work on custom elements', () => {
      const container = document.createElement('div');
      ReactDOM.render(<my-custom-element textContent="foo" />, container);
      const customElement = container.querySelector('my-custom-element');
      expect(customElement.getAttribute('textContent')).toBe(null);
      expect(customElement.hasChildNodes()).toBe(false);

      // Render again to verify the update codepath doesn't accidentally let
      // something through.
      ReactDOM.render(<my-custom-element textContent="bar" />, container);
      expect(customElement.getAttribute('textContent')).toBe(null);
      expect(customElement.hasChildNodes()).toBe(false);
    });

    // @gate enableCustomElementPropertySupport
    it('values should not be converted to booleans when assigning into custom elements', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      ReactDOM.render(<my-custom-element />, container);
      const customElement = container.querySelector('my-custom-element');
      customElement.foo = null;

      // true => string
      ReactDOM.render(<my-custom-element foo={true} />, container);
      expect(customElement.foo).toBe(true);
      ReactDOM.render(<my-custom-element foo="bar" />, container);
      expect(customElement.foo).toBe('bar');

      // false => string
      ReactDOM.render(<my-custom-element foo={false} />, container);
      expect(customElement.foo).toBe(false);
      ReactDOM.render(<my-custom-element foo="bar" />, container);
      expect(customElement.foo).toBe('bar');

      // true => null
      ReactDOM.render(<my-custom-element foo={true} />, container);
      expect(customElement.foo).toBe(true);
      ReactDOM.render(<my-custom-element foo={null} />, container);
      expect(customElement.foo).toBe(null);

      // false => null
      ReactDOM.render(<my-custom-element foo={false} />, container);
      expect(customElement.foo).toBe(false);
      ReactDOM.render(<my-custom-element foo={null} />, container);
      expect(customElement.foo).toBe(null);
    });

    // @gate enableCustomElementPropertySupport
    it('custom element custom event handlers assign multiple types', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const oncustomevent = jest.fn();

      // First render with string
      ReactDOM.render(<my-custom-element oncustomevent={'foo'} />, container);
      const customelement = container.querySelector('my-custom-element');
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(0);
      expect(customelement.oncustomevent).toBe(undefined);
      expect(customelement.getAttribute('oncustomevent')).toBe('foo');

      // string => event listener
      ReactDOM.render(
        <my-custom-element oncustomevent={oncustomevent} />,
        container,
      );
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
      expect(customelement.oncustomevent).toBe(undefined);
      expect(customelement.getAttribute('oncustomevent')).toBe(null);

      // event listener => string
      ReactDOM.render(<my-custom-element oncustomevent={'foo'} />, container);
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
      expect(customelement.oncustomevent).toBe(undefined);
      expect(customelement.getAttribute('oncustomevent')).toBe('foo');

      // string => nothing
      ReactDOM.render(<my-custom-element />, container);
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
      expect(customelement.oncustomevent).toBe(undefined);
      expect(customelement.getAttribute('oncustomevent')).toBe(null);

      // nothing => event listener
      ReactDOM.render(
        <my-custom-element oncustomevent={oncustomevent} />,
        container,
      );
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(2);
      expect(customelement.oncustomevent).toBe(undefined);
      expect(customelement.getAttribute('oncustomevent')).toBe(null);
    });

    // @gate enableCustomElementPropertySupport
    it('custom element custom event handlers assign multiple types with setter', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const oncustomevent = jest.fn();

      // First render with nothing
      ReactDOM.render(<my-custom-element />, container);
      const customelement = container.querySelector('my-custom-element');
      // Install a setter to activate the `in` heuristic
      Object.defineProperty(customelement, 'oncustomevent', {
        set: function(x) {
          this._oncustomevent = x;
        },
        get: function() {
          return this._oncustomevent;
        },
      });
      expect(customelement.oncustomevent).toBe(undefined);

      // nothing => event listener
      ReactDOM.render(
        <my-custom-element oncustomevent={oncustomevent} />,
        container,
      );
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
      expect(customelement.oncustomevent).toBe(null);
      expect(customelement.getAttribute('oncustomevent')).toBe(null);

      // event listener => string
      ReactDOM.render(<my-custom-element oncustomevent={'foo'} />, container);
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(1);
      expect(customelement.oncustomevent).toBe('foo');
      expect(customelement.getAttribute('oncustomevent')).toBe(null);

      // string => event listener
      ReactDOM.render(
        <my-custom-element oncustomevent={oncustomevent} />,
        container,
      );
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(2);
      expect(customelement.oncustomevent).toBe(null);
      expect(customelement.getAttribute('oncustomevent')).toBe(null);

      // event listener => nothing
      ReactDOM.render(<my-custom-element />, container);
      customelement.dispatchEvent(new Event('customevent'));
      expect(oncustomevent).toHaveBeenCalledTimes(2);
      expect(customelement.oncustomevent).toBe(null);
      expect(customelement.getAttribute('oncustomevent')).toBe(null);
    });

    // @gate enableCustomElementPropertySupport
    it('assigning to a custom element property should not remove attributes', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      ReactDOM.render(<my-custom-element foo="one" />, container);
      const customElement = container.querySelector('my-custom-element');
      expect(customElement.getAttribute('foo')).toBe('one');

      // Install a setter to activate the `in` heuristic
      Object.defineProperty(customElement, 'foo', {
        set: function(x) {
          this._foo = x;
        },
        get: function() {
          return this._foo;
        },
      });
      ReactDOM.render(<my-custom-element foo="two" />, container);
      expect(customElement.foo).toBe('two');
      expect(customElement.getAttribute('foo')).toBe('one');
    });

    // @gate enableCustomElementPropertySupport
    it('custom element properties should accept functions', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      ReactDOM.render(<my-custom-element />, container);
      const customElement = container.querySelector('my-custom-element');

      // Install a setter to activate the `in` heuristic
      Object.defineProperty(customElement, 'foo', {
        set: function(x) {
          this._foo = x;
        },
        get: function() {
          return this._foo;
        },
      });
      function myFunction() {
        return 'this is myFunction';
      }
      ReactDOM.render(<my-custom-element foo={myFunction} />, container);
      expect(customElement.foo).toBe(myFunction);

      // Also remove and re-add the property for good measure
      ReactDOM.render(<my-custom-element />, container);
      expect(customElement.foo).toBe(null);
      ReactDOM.render(<my-custom-element foo={myFunction} />, container);
      expect(customElement.foo).toBe(myFunction);
    });
  });

  describe('deleteValueForProperty', () => {
    it('should remove attributes for normal properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(<div title="foo" />, container);
      expect(container.firstChild.getAttribute('title')).toBe('foo');
      ReactDOM.render(<div />, container);
      expect(container.firstChild.getAttribute('title')).toBe(null);
    });

    it('should not remove attributes for special properties', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <input type="text" value="foo" onChange={function() {}} />,
        container,
      );
      if (disableInputAttributeSyncing) {
        expect(container.firstChild.hasAttribute('value')).toBe(false);
      } else {
        expect(container.firstChild.getAttribute('value')).toBe('foo');
      }
      expect(container.firstChild.value).toBe('foo');
      expect(() =>
        ReactDOM.render(
          <input type="text" onChange={function() {}} />,
          container,
        ),
      ).toErrorDev(
        'A component is changing a controlled input to be uncontrolled',
      );
      if (disableInputAttributeSyncing) {
        expect(container.firstChild.hasAttribute('value')).toBe(false);
      } else {
        expect(container.firstChild.getAttribute('value')).toBe('foo');
      }
      expect(container.firstChild.value).toBe('foo');
    });

    it('should not remove attributes for custom component tag', () => {
      const container = document.createElement('div');
      ReactDOM.render(<my-icon size="5px" />, container);
      expect(container.firstChild.getAttribute('size')).toBe('5px');
    });
  });
});
