/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('DOMPropertyOperations', function() {
  var DOMPropertyOperations;
  var DOMProperty;

  var mocks;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    var ReactDefaultInjection = require('ReactDefaultInjection');
    ReactDefaultInjection.inject();

    DOMPropertyOperations = require('DOMPropertyOperations');
    DOMProperty = require('DOMProperty');

    mocks = require('mocks');
  });

  describe('createMarkupForProperty', function() {

    it('should create markup for simple properties', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'name',
        'simple'
      )).toBe('name="simple"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'name',
        false
      )).toBe('name="false"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'name',
        null
      )).toBe('');
    });

    it('should work with the id attribute', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'id',
        'simple'
      )).toBe('id="simple"');
    });

    it('should warn about incorrect casing', function() {
      spyOn(console, 'warn');
      expect(DOMPropertyOperations.createMarkupForProperty(
        'tabindex',
        '1'
      )).toBe(null);
      expect(console.warn.argsForCall.length).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain('tabIndex');
    });

    it('should warn about class', function() {
      spyOn(console, 'warn');
      expect(DOMPropertyOperations.createMarkupForProperty(
        'class',
        'muffins'
      )).toBe(null);
      expect(console.warn.argsForCall.length).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain('className');
    });

    it('should create markup for boolean properties', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'checked',
        'simple'
      )).toBe('checked');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'checked',
        true
      )).toBe('checked');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'checked',
        false
      )).toBe('');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'scoped',
        true
      )).toBe('scoped');
    });

    it('should create markup for booleanish properties', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        'simple'
      )).toBe('download="simple"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        true
      )).toBe('download');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        'true'
      )).toBe('download="true"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        false
      )).toBe('');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        'false'
      )).toBe('download="false"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        undefined
      )).toBe('');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        null
      )).toBe('');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'download',
        0
      )).toBe('download="0"');
    });

    it('should create markup for custom attributes', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'aria-label',
        'simple'
      )).toBe('aria-label="simple"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'aria-label',
        false
      )).toBe('aria-label="false"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'aria-label',
        null
      )).toBe('');
    });

    it('should create markup for numeric properties', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'start',
        5
      )).toBe('start="5"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'start',
        0
      )).toBe('start="0"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'size',
        0
      )).toBe('');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'size',
        1
      )).toBe('size="1"');
    });

  });

  describe('setValueForProperty', function() {
    var stubNode;

    beforeEach(function() {
      stubNode = document.createElement('div');
    });

    it('should set values as properties by default', function() {
      DOMPropertyOperations.setValueForProperty(stubNode, 'title', 'Tip!');
      expect(stubNode.title).toBe('Tip!');
    });

    it('should set values as attributes if necessary', function() {
      DOMPropertyOperations.setValueForProperty(stubNode, 'role', '#');
      expect(stubNode.getAttribute('role')).toBe('#');
      expect(stubNode.role).toBeUndefined();
    });

    it('should convert attribute values to string first', function() {
      // Browsers default to this behavior, but some test environments do not.
      // This ensures that we have consistent behavior.
      var obj = {toString: function() { return '<html>'; }};
      DOMPropertyOperations.setValueForProperty(stubNode, 'role', obj);
      expect(stubNode.getAttribute('role')).toBe('<html>');
    });

    it('should remove for falsey boolean properties', function() {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'allowFullScreen',
        false
      );
      expect(stubNode.hasAttribute('allowFullScreen')).toBe(false);
    });

    it('should remove when setting custom attr to null', function() {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'data-foo',
        'bar'
      );
      expect(stubNode.hasAttribute('data-foo')).toBe(true);
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'data-foo',
        null
      );
      expect(stubNode.hasAttribute('data-foo')).toBe(false);
    });

    it('should use mutation method where applicable', function() {
      var foobarSetter = mocks.getMockFunction();
      // inject foobar DOM property
      DOMProperty.injection.injectDOMPropertyConfig({
        Properties: {foobar: null},
        DOMMutationMethods: {
          foobar: foobarSetter
        }
      });

      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'foobar',
        'cows say moo'
      );

      expect(foobarSetter.mock.calls.length).toBe(1);
      expect(foobarSetter.mock.calls[0][0]).toBe(stubNode);
      expect(foobarSetter.mock.calls[0][1]).toBe('cows say moo');
    });

    it('should set className to empty string instead of null', function() {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'className',
        'selected'
      );
      expect(stubNode.className).toBe('selected');

      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'className',
        null
      );
      // className should be '', not 'null' or null (which becomes 'null' in
      // some browsers)
      expect(stubNode.className).toBe('');
    });

    it('should remove property properly even with different name', function() {
      // Suppose 'foobar' is a property that corresponds to the underlying
      // 'className' property:
      DOMProperty.injection.injectDOMPropertyConfig({
        Properties: {foobar: DOMProperty.injection.MUST_USE_PROPERTY},
        DOMPropertyNames: {
          foobar: 'className'
        }
      });

      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'foobar',
        'selected'
      );
      expect(stubNode.className).toBe('selected');

      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'foobar',
        null
      );
      // className should be '', not 'null' or null (which becomes 'null' in
      // some browsers)
      expect(stubNode.className).toBe('');
    });

  });

  describe('injectDOMPropertyConfig', function() {
    it('should support custom attributes', function() {
      // foobar does not exist yet
      expect(DOMPropertyOperations.createMarkupForProperty(
        'foobar',
        'simple'
      )).toBe(null);

      // foo-* does not exist yet
      expect(DOMPropertyOperations.createMarkupForProperty(
        'foo-xyz',
        'simple'
      )).toBe(null);

      // inject foobar DOM property
      DOMProperty.injection.injectDOMPropertyConfig({
        isCustomAttribute: function(name) {
          return name.indexOf('foo-') === 0;
        },
        Properties: {foobar: null}
      });

      // Ensure old attributes still work
      expect(DOMPropertyOperations.createMarkupForProperty(
        'name',
        'simple'
      )).toBe('name="simple"');
      expect(DOMPropertyOperations.createMarkupForProperty(
        'data-name',
        'simple'
      )).toBe('data-name="simple"');

      // foobar should work
      expect(DOMPropertyOperations.createMarkupForProperty(
        'foobar',
        'simple'
      )).toBe('foobar="simple"');

      // foo-* should work
      expect(DOMPropertyOperations.createMarkupForProperty(
        'foo-xyz',
        'simple'
      )).toBe('foo-xyz="simple"');

      // It should complain about double injections.
      expect(function() {
        DOMProperty.injection.injectDOMPropertyConfig(
          {Properties: {foobar: null}}
        );
      }).toThrow();
    });
  });
});
