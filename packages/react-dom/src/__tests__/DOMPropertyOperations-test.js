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
      ).toWarnDev(
        'A component is changing a controlled input of type text to be uncontrolled',
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
