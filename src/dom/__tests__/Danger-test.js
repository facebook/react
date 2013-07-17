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

describe('Danger', function() {

  describe('dangerouslyInsertMarkupAt', function() {
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
      var parent = document.createElement('div');

      Danger.dangerouslyInsertMarkupAt(parent, markup, 0);

      expect(parent.innerHTML).toBe('<div data-reactid=".rX"></div>');
    });

    it('should render markup with props', function() {
      var markup = (<div className="foo" />).mountComponent('.rX', transaction);
      var parent = document.createElement('div');

      Danger.dangerouslyInsertMarkupAt(parent, markup, 0);

      expect(parent.innerHTML).toBe(
        '<div class="foo" data-reactid=".rX"></div>'
      );
    });

    it('should render wrapped markup', function() {
      var markup = (<th />).mountComponent('.rX', transaction);
      var parent = document.createElement('div');

      Danger.dangerouslyInsertMarkupAt(parent, markup, 0);

      expect(parent.innerHTML).toBe('<th data-reactid=".rX"></th>');
    });

  });

});
