/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

describe('ReactDOMIDOperations', function() {
  var DOMPropertyOperations = require('DOMPropertyOperations');
  var ReactDOMIDOperations = require('ReactDOMIDOperations');
  var ReactMount = require('ReactMount');
  var keyOf = require('keyOf');

  it('should disallow updating special properties', function() {
    spyOn(ReactMount, "getNode");
    spyOn(DOMPropertyOperations, "setValueForProperty");

    expect(function() {
      ReactDOMIDOperations.updatePropertyByID(
        'testID',
        keyOf({dangerouslySetInnerHTML: null}),
        {__html: 'testContent'}
      );
    }).toThrow();

    expect(
      ReactMount.getNode.argsForCall[0][0]
    ).toBe('testID');

    expect(
      DOMPropertyOperations.setValueForProperty.callCount
    ).toBe(0);
  });

  it('should update innerHTML and preserve whitespace', function() {
    var stubNode = document.createElement('div');
    spyOn(ReactMount, "getNode").andReturn(stubNode);

    var html = '\n  \t  <span>  \n  testContent  \t  </span>  \n  \t';

    ReactDOMIDOperations.updateInnerHTMLByID(
      'testID',
      html
    );

    expect(
      ReactMount.getNode.argsForCall[0][0]
    ).toBe('testID');

    expect(stubNode.innerHTML).toBe(html);
  });
});
