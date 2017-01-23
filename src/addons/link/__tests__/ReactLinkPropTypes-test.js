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

var emptyFunction = require('emptyFunction');
var LinkPropTypes = require('ReactLink').PropTypes;
var React = require('React');
var ReactPropTypesSecret = require('ReactPropTypesSecret');

var invalidMessage = 'Invalid prop `testProp` supplied to `testComponent`.';
var requiredMessage = 'The prop `testProp` is marked as required in ' +
  '`testComponent`, but its value is `undefined`.';

function typeCheckFail(declaration, value, message) {
  var props = {testProp: value};
  var error = declaration(
    props,
    'testProp',
    'testComponent',
    'prop',
    null,
    ReactPropTypesSecret
  );
  expect(error instanceof Error).toBe(true);
  expect(error.message).toBe(message);
}

function typeCheckPass(declaration, value) {
  var props = {testProp: value};
  var error = declaration(
    props,
    'testProp',
    'testComponent',
    'prop',
    null,
    ReactPropTypesSecret
  );
  expect(error).toBe(null);
}

describe('ReactLink', () => {
  it('should fail if the argument does not implement the Link API', () => {
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {},
      'The prop `testProp.value` is marked as required in `testComponent`, ' +
        'but its value is `undefined`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {value: 123},
      'The prop `testProp.requestChange` is marked as required in ' +
        '`testComponent`, but its value is `undefined`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {requestChange: emptyFunction},
      'The prop `testProp.value` is marked as required in `testComponent`, ' +
        'but its value is `undefined`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {value: null, requestChange: null},
      'The prop `testProp.value` is marked as required in `testComponent`, ' +
        'but its value is `null`.'
    );
  });

  it('should allow valid links even if no type was specified', () => {
    typeCheckPass(
      LinkPropTypes.link(),
      {value: 42, requestChange: emptyFunction}
    );
    typeCheckPass(
      LinkPropTypes.link(),
      {value: {}, requestChange: emptyFunction}
    );
  });

  it('should allow no link to be passed at all', () => {
    typeCheckPass(
      LinkPropTypes.link(React.PropTypes.string),
      undefined
    );
  });

  it('should allow valid links with correct value format', () => {
    typeCheckPass(
      LinkPropTypes.link(React.PropTypes.any),
      {value: 42, requestChange: emptyFunction}
    );
    typeCheckPass(
      LinkPropTypes.link(React.PropTypes.number),
      {value: 42, requestChange: emptyFunction}
    );
    typeCheckPass(
      LinkPropTypes.link(React.PropTypes.node),
      {value: 42, requestChange: emptyFunction}
    );
  });

  it('should fail if the link`s value type does not match', () => {
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string),
      {value: 123, requestChange: emptyFunction},
      'Invalid prop `testProp.value` of type `number` supplied to `testComponent`,' +
      ' expected `string`.'
    );
  });

  it('should be implicitly optional and not warn without values', () => {
    typeCheckPass(LinkPropTypes.link(), null);
    typeCheckPass(LinkPropTypes.link(), undefined);
    typeCheckPass(LinkPropTypes.link(React.PropTypes.string), null);
    typeCheckPass(LinkPropTypes.link(React.PropTypes.string), undefined);
  });

  it('should warn for missing required values', () => {
    var specifiedButIsNullMsg = 'The prop `testProp` is marked as required ' +
      'in `testComponent`, but its value is `null`.';
    typeCheckFail(LinkPropTypes.link().isRequired, null, specifiedButIsNullMsg);
    typeCheckFail(LinkPropTypes.link().isRequired, undefined, requiredMessage);
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string).isRequired,
      null,
      specifiedButIsNullMsg
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string).isRequired,
      undefined,
      requiredMessage
    );
  });

  it('should be compatible with React.PropTypes.oneOfType', () => {
    typeCheckPass(
      React.PropTypes.oneOfType([LinkPropTypes.link(React.PropTypes.number)]),
      {value: 123, requestChange: emptyFunction}
    );
    typeCheckFail(
      React.PropTypes.oneOfType([LinkPropTypes.link(React.PropTypes.number)]),
      123,
      invalidMessage
    );
    typeCheckPass(
      LinkPropTypes.link(React.PropTypes.oneOfType([React.PropTypes.number])),
      {value: 123, requestChange: emptyFunction}
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.oneOfType([React.PropTypes.number])),
      {value: 'imastring', requestChange: emptyFunction},
      'Invalid prop `testProp.value` supplied to `testComponent`.'
    );
  });
});
