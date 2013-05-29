/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

describe('DOMPropertyOperations', function() {
  var DOMPropertyOperations;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    DOMPropertyOperations = require('DOMPropertyOperations');
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

    it('should create markup for boolean properties', function() {
      expect(DOMPropertyOperations.createMarkupForProperty(
        'checked',
        'simple'
      )).toBe('checked="simple"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'checked',
        true
      )).toBe('checked="true"');

      expect(DOMPropertyOperations.createMarkupForProperty(
        'checked',
        false
      )).toBe('');
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
      DOMPropertyOperations.setValueForProperty(stubNode, 'ajaxify', '#');
      expect(stubNode.getAttribute('ajaxify')).toBe('#');
      expect(stubNode.ajaxify).toBeUndefined();
    });

    it('should remove for falsey boolean properties', function() {
      DOMPropertyOperations.setValueForProperty(
        stubNode,
        'allowFullScreen',
        false
      );
      expect(stubNode.hasAttribute('allowFullScreen')).toBe(false);
    });

    it('should use mutation method where applicable', function() {
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
      expect(stubNode.className).toBe('');
    });

  });
});
