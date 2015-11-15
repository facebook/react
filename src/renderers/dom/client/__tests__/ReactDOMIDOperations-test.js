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

describe('ReactDOMIDOperations', function() {
  var ReactDOMIDOperations = require('ReactDOMIDOperations');
  var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');

  it('should update innerHTML and preserve whitespace', function() {
    var stubNode = document.createElement('div');
    var html = '\n  \t  <span>  \n  testContent  \t  </span>  \n  \t';

    ReactDOMIDOperations.dangerouslyProcessChildrenUpdates(
      [{
        parentInst: {_nativeNode: stubNode},
        parentNode: null,
        type: ReactMultiChildUpdateTypes.SET_MARKUP,
        markupIndex: null,
        content: html,
        fromIndex: null,
        toIndex: null,
      }],
      []
    );

    expect(stubNode.innerHTML).toBe(html);
  });
});
