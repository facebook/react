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
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

describe('ReactDOMIDOperations', function() {
  var DOMPropertyOperations = require('DOMPropertyOperations');
  var ReactDOMIDOperations = require('ReactDOMIDOperations');
  var ReactDOMNodeCache = require('ReactDOMNodeCache');
  var keyOf = require('keyOf');

  it('should disallow updating special properties', function() {
    spyOn(ReactDOMNodeCache, "getCachedNodeByID");
    spyOn(DOMPropertyOperations, "setValueForProperty");

    expect(function() {
      ReactDOMIDOperations.updatePropertyByID(
        'testID',
        keyOf({content: null}),
        'testContent'
      );
    }).toThrow();

    expect(
      ReactDOMNodeCache.getCachedNodeByID.argsForCall[0][0]
    ).toBe('testID');

    expect(
      DOMPropertyOperations.setValueForProperty.callCount
    ).toBe(0);
  });

  it('should update innerHTML and special-case whitespace', function() {
    var stubNode = document.createElement('div');
    spyOn(ReactDOMNodeCache, "getCachedNodeByID").andReturn(stubNode);

    ReactDOMIDOperations.updateInnerHTMLByID(
      'testID',
      {__html: ' testContent'}
    );

    expect(
      ReactDOMNodeCache.getCachedNodeByID.argsForCall[0][0]
    ).toBe('testID');

    expect(stubNode.innerHTML).toBe('&nbsp;testContent');
  });
});
