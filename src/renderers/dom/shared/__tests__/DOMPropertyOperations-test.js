/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('DOMPropertyOperations', () => {
  var DOMPropertyOperations;
  var DOMProperty;
  var ReactDOMComponentTree;

  beforeEach(() => {
    jest.resetModules();
    require('ReactDOMInjection');

    // TODO: can we express this test with only public API?
    DOMPropertyOperations = require('DOMPropertyOperations');
    DOMProperty = require('DOMProperty');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
  });

  describe('setValueForProperty', () => {
    var stubNode;
    var stubInstance;

    beforeEach(() => {
      stubNode = document.createElement('div');
      stubInstance = {_debugID: 1};
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);
    });

    it('should set values as properties by default', () => {
      DOMPropertyOperations.setValueForProperty(stubNode, 'title', 'Tip!');
      expect(stubNode.title).toBe('Tip!');
    });

    it('should set values as attributes if necessary', () => {
      DOMPropertyOperations.setValueForProperty(stubNode, 'role', '#');
      expect(stubNode.getAttribute('role')).toBe('#');
      expect(stubNode.role).toBeUndefined();
    });

    it('should set values as namespace attributes if necessary', () => {
      spyOn(stubNode, 'setAttributeNS');
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'xlinkHref',
        'about:blank',
      );
      expect(stubNode.setAttributeNS.calls.count()).toBe(1);
      expect(stubNode.setAttributeNS.calls.argsFor(0)).toEqual([
        'http://www.w3.org/1999/xlink',
        'xlink:href',
        'about:blank',
      ]);
    });

    it('should set values as boolean properties', () => {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'disabled',
        'disabled',
      );
      expect(stubNode.getAttribute('disabled')).toBe('');
      DOMPropertyOperations.setValueForProperty(stubNode, 'disabled', true);
      expect(stubNode.getAttribute('disabled')).toBe('');
      DOMPropertyOperations.setValueForProperty(stubNode, 'disabled', false);
      expect(stubNode.getAttribute('disabled')).toBe(null);
    });

    it('should convert attribute values to string first', () => {
      // Browsers default to this behavior, but some test environments do not.
      // This ensures that we have consistent behavior.
      var obj = {
        toString: function() {
          return '<html>';
        },
      };
      DOMPropertyOperations.setValueForProperty(stubNode, 'role', obj);
      expect(stubNode.getAttribute('role')).toBe('<html>');
    });

    it('should not remove empty attributes for special properties', () => {
      stubNode = document.createElement('input');
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

      DOMPropertyOperations.setValueForProperty(stubNode, 'value', '');
      // JSDOM does not behave correctly for attributes/properties
      //expect(stubNode.getAttribute('value')).toBe('');
      expect(stubNode.value).toBe('');
    });

    it('should remove for falsey boolean properties', () => {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'allowFullScreen',
        false,
      );
      expect(stubNode.hasAttribute('allowFullScreen')).toBe(false);
    });

    it('should remove when setting custom attr to null', () => {
      DOMPropertyOperations.setValueForProperty(stubNode, 'data-foo', 'bar');
      expect(stubNode.hasAttribute('data-foo')).toBe(true);
      DOMPropertyOperations.setValueForProperty(stubNode, 'data-foo', null);
      expect(stubNode.hasAttribute('data-foo')).toBe(false);
    });

    it('should use mutation method where applicable', () => {
      var foobarSetter = jest.fn();
      // inject foobar DOM property
      DOMProperty.injection.injectDOMPropertyConfig({
        Properties: {foobar: null},
        DOMMutationMethods: {
          foobar: foobarSetter,
        },
      });

      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'foobar',
        'cows say moo',
      );

      expect(foobarSetter.mock.calls.length).toBe(1);
      expect(foobarSetter.mock.calls[0][0]).toBe(stubNode);
      expect(foobarSetter.mock.calls[0][1]).toBe('cows say moo');
    });

    it('should set className to empty string instead of null', () => {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'className',
        'selected',
      );
      expect(stubNode.className).toBe('selected');

      DOMPropertyOperations.setValueForProperty(stubNode, 'className', null);
      // className should be '', not 'null' or null (which becomes 'null' in
      // some browsers)
      expect(stubNode.className).toBe('');
      expect(stubNode.getAttribute('class')).toBe(null);
    });

    it('should remove property properly for boolean properties', () => {
      DOMPropertyOperations.setValueForProperty(stubNode, 'hidden', true);
      expect(stubNode.hasAttribute('hidden')).toBe(true);

      DOMPropertyOperations.setValueForProperty(stubNode, 'hidden', false);
      expect(stubNode.hasAttribute('hidden')).toBe(false);
    });

    it('should remove property properly even with different name', () => {
      // Suppose 'foobar' is a property that corresponds to the underlying
      // 'className' property:
      DOMProperty.injection.injectDOMPropertyConfig({
        Properties: {foobar: DOMProperty.injection.MUST_USE_PROPERTY},
        DOMPropertyNames: {
          foobar: 'className',
        },
        DOMAttributeNames: {
          foobar: 'class',
        },
      });

      DOMPropertyOperations.setValueForProperty(stubNode, 'foobar', 'selected');
      expect(stubNode.className).toBe('selected');

      DOMPropertyOperations.setValueForProperty(stubNode, 'foobar', null);
      // className should be '', not 'null' or null (which becomes 'null' in
      // some browsers)
      expect(stubNode.className).toBe('');
    });
  });

  describe('value mutation method', function() {
    it('should update an empty attribute to zero', function() {
      var stubNode = document.createElement('input');
      var stubInstance = {_debugID: 1};
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

      stubNode.setAttribute('type', 'radio');

      DOMPropertyOperations.setValueForProperty(stubNode, 'value', '');
      spyOn(stubNode, 'setAttribute');
      DOMPropertyOperations.setValueForProperty(stubNode, 'value', 0);

      expect(stubNode.setAttribute.calls.count()).toBe(1);
    });

    it('should always assign the value attribute for non-inputs', function() {
      var stubNode = document.createElement('progress');
      var stubInstance = {_debugID: 1};
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

      spyOn(stubNode, 'setAttribute');

      DOMPropertyOperations.setValueForProperty(stubNode, 'value', 30);
      DOMPropertyOperations.setValueForProperty(stubNode, 'value', '30');

      expect(stubNode.setAttribute.calls.count()).toBe(2);
    });
  });

  describe('deleteValueForProperty', () => {
    var stubNode;
    var stubInstance;

    beforeEach(() => {
      stubNode = document.createElement('div');
      stubInstance = {_debugID: 1};
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);
    });

    it('should remove attributes for normal properties', () => {
      DOMPropertyOperations.setValueForProperty(stubNode, 'title', 'foo');
      expect(stubNode.getAttribute('title')).toBe('foo');
      expect(stubNode.title).toBe('foo');

      DOMPropertyOperations.deleteValueForProperty(stubNode, 'title');
      expect(stubNode.getAttribute('title')).toBe(null);
      // JSDOM does not behave correctly for attributes/properties
      //expect(stubNode.title).toBe('');
    });

    it('should not remove attributes for special properties', () => {
      stubNode = document.createElement('input');
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

      stubNode.setAttribute('value', 'foo');

      DOMPropertyOperations.deleteValueForProperty(stubNode, 'value');
      // JSDOM does not behave correctly for attributes/properties
      //expect(stubNode.getAttribute('value')).toBe('foo');
      expect(stubNode.value).toBe('');
    });

    it('should not leave all options selected when deleting multiple', () => {
      stubNode = document.createElement('select');
      ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

      stubNode.multiple = true;
      stubNode.appendChild(document.createElement('option'));
      stubNode.appendChild(document.createElement('option'));
      stubNode.options[0].selected = true;
      stubNode.options[1].selected = true;

      DOMPropertyOperations.deleteValueForProperty(stubNode, 'multiple');
      expect(stubNode.getAttribute('multiple')).toBe(null);
      expect(stubNode.multiple).toBe(false);

      expect(stubNode.options[0].selected && stubNode.options[1].selected).toBe(
        false,
      );
    });
  });
});
