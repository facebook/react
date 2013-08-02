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

/*jslint evil: true */

var React = require('React');
var DOCUMENT_FRAGMENT_NODE_TYPE = 11;

describe('Danger', function() {

  describe('dangerouslyRenderMarkup', function() {
    var Danger;
    var transaction;

    beforeEach(function() {
      require('mock-modules').dumpCache();
      Danger = require('Danger');

      var ReactReconcileTransaction = require('ReactReconcileTransaction');
      transaction = new ReactReconcileTransaction();
    });

    it('should render markup', function() {
      var markup = (<div />).mountComponent('.rX', transaction);
      var output = Danger.dangerouslyRenderMarkup([markup])[0];

      expect(output.nodeName).toBe('DIV');
    });

    it('should render markup with props', function() {
      var markup = (<div className="foo" />).mountComponent('.rX', transaction);
      var output = Danger.dangerouslyRenderMarkup([markup])[0];

      expect(output.nodeName).toBe('DIV');
      expect(output.className).toBe('foo');
    });

    it('should render wrapped markup', function() {
      var markup = (<th />).mountComponent('.rX', transaction);
      var output = Danger.dangerouslyRenderMarkup([markup])[0];

      expect(output.nodeName).toBe('TH');
    });

    it('should render lists of markup with similar `nodeName`', function() {
      var renderedMarkup = Danger.dangerouslyRenderMarkup(
        ['<p id="A">1</p>', '<p id="B">2</p>', '<p id="C">3</p>']
      );

      expect(renderedMarkup.length).toBe(3);

      expect(renderedMarkup[0].nodeName).toBe('P');
      expect(renderedMarkup[1].nodeName).toBe('P');
      expect(renderedMarkup[2].nodeName).toBe('P');

      expect(renderedMarkup[0].innerHTML).toBe('1');
      expect(renderedMarkup[1].innerHTML).toBe('2');
      expect(renderedMarkup[2].innerHTML).toBe('3');
    });

    it('should render lists of markup with different `nodeName`', function() {
      var renderedMarkup = Danger.dangerouslyRenderMarkup(
        ['<p id="A">1</p>', '<td id="B">2</td>', '<p id="C">3</p>']
      );

      expect(renderedMarkup.length).toBe(3);

      expect(renderedMarkup[0].nodeName).toBe('P');
      expect(renderedMarkup[1].nodeName).toBe('TD');
      expect(renderedMarkup[2].nodeName).toBe('P');

      expect(renderedMarkup[0].innerHTML).toBe('1');
      expect(renderedMarkup[1].innerHTML).toBe('2');
      expect(renderedMarkup[2].innerHTML).toBe('3');
    });

    it('should use document fragments to group nodes that parse to more than one node', function() {
      var renderedMarkup;

      expect(function() {
        renderedMarkup = Danger.dangerouslyRenderMarkup([
          '<a id="before">before anchor</a>',
          '<a id="outer"><a id="inner">nested anchors</a></a>',
          '<a id="after">after anchor</a>'
        ]);
      }).not.toThrow();

      expect(renderedMarkup.length).toBe(3);

      // Easy cases / sanity check.
      expect(renderedMarkup[0].nodeName).toBe('A');
      expect(renderedMarkup[0].id).toBe('before');
      expect(renderedMarkup[2].nodeName).toBe('A');
      expect(renderedMarkup[2].id).toBe('after');

      // Document fragment!
      expect(renderedMarkup[1].nodeType).toBe(DOCUMENT_FRAGMENT_NODE_TYPE);
      expect(renderedMarkup[1].childNodes.length).toBe(2);
      expect(renderedMarkup[1].firstChild.nodeName).toBe('A');
      expect(renderedMarkup[1].lastChild.nodeName).toBe('A');
    });

    it('should throw when rendering invalid markup', function() {
      expect(function() {
        Danger.dangerouslyRenderMarkup(['']);
      }).toThrow(
        'Invariant Violation: dangerouslyRenderMarkup(...): Missing markup.'
      );

      var renderedMarkup;

      expect(function() {
        renderedMarkup = Danger.dangerouslyRenderMarkup(['<p></p><p></p>']);
      }).not.toThrow();

      expect(renderedMarkup.length).toBe(1);
      expect(renderedMarkup[0].nodeType).toBe(DOCUMENT_FRAGMENT_NODE_TYPE);
      expect(renderedMarkup[0].childNodes.length).toBe(2);
      expect(renderedMarkup[0].firstChild.nodeName).toBe('P');
      expect(renderedMarkup[0].lastChild.nodeName).toBe('P');
    });
  });

});
