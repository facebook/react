/**
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
