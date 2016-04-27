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

describe('ReactDOMIDOperations', function() {
  var ReactDOMComponentTree = require('ReactDOMComponentTree');
  var ReactDOMIDOperations = require('ReactDOMIDOperations');
  var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');

  it('should update innerHTML and preserve whitespace', function() {
    var stubNode = document.createElement('div');
    var stubInstance = {};
    ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

    var html = '\n  \t  <span>  \n  testContent  \t  </span>  \n  \t';
    ReactDOMIDOperations.dangerouslyProcessChildrenUpdates(
      stubInstance,
      [{
        type: ReactMultiChildUpdateTypes.SET_MARKUP,
        content: html,
        fromIndex: null,
        toIndex: null,
      }],
      []
    );

    expect(stubNode.innerHTML).toBe(html);
  });
});
