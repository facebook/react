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

describe('ReactDOMIDOperations', () => {
  var ReactDOMComponentTree = require('ReactDOMComponentTree');
  var ReactDOMIDOperations = require('ReactDOMIDOperations');

  it('should update innerHTML and preserve whitespace', () => {
    var stubNode = document.createElement('div');
    var stubInstance = {_debugID: 1};
    ReactDOMComponentTree.precacheNode(stubInstance, stubNode);

    var html = '\n  \t  <span>  \n  testContent  \t  </span>  \n  \t';
    ReactDOMIDOperations.dangerouslyProcessChildrenUpdates(
      stubInstance,
      [
        {
          type: 'SET_MARKUP',
          content: html,
          fromIndex: null,
          toIndex: null,
        },
      ],
      [],
    );

    expect(stubNode.innerHTML).toBe(html);
  });
});
