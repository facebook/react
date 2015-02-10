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

/*jslint evil: true */

'use strict';

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
      DOMPropertyOperations.setValueForProperty.calls.length
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
