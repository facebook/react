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

var emptyFunction = require('emptyFunction');
var LinkPropTypes = require('ReactLink').PropTypes;
var React = require('React');
var ReactPropTypeLocations = require('ReactPropTypeLocations');

var invalidMessage = 'Invalid prop `testProp` supplied to `testComponent`.';
var requiredMessage =
  'Required prop `testProp` was not specified in `testComponent`.';

function typeCheckFail(declaration, value, message) {
  var props = {testProp: value};
  var error = declaration(
    props,
    'testProp',
    'testComponent',
    ReactPropTypeLocations.prop
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
    ReactPropTypeLocations.prop
  );
  expect(error).toBe(null);
}

describe('ReactLink', function() {
  it('should fail if the argument does not implement the Link API', function() {
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {},
      'Required prop `testProp.value` was not specified in `testComponent`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {value: 123},
      'Required prop `testProp.requestChange` was not specified in `testComponent`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {requestChange: emptyFunction},
      'Required prop `testProp.value` was not specified in `testComponent`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {value: null, requestChange: null},
      'Required prop `testProp.value` was not specified in `testComponent`.'
    );
  });

  it('should allow valid links even if no type was specified', function() {
    typeCheckPass(
      LinkPropTypes.link(),
      {value: 42, requestChange: emptyFunction}
    );
    typeCheckPass(
      LinkPropTypes.link(),
      {value: {}, requestChange: emptyFunction,
    });
  });

  it('should allow no link to be passed at all', function() {
    typeCheckPass(
      LinkPropTypes.link(React.PropTypes.string),
      undefined
    );
  });

  it('should allow valid links with correct value format', function() {
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

  it('should fail if the link`s value type does not match', function() {
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string),
      {value: 123, requestChange: emptyFunction},
      'Invalid prop `testProp.value` of type `number` supplied to `testComponent`,' +
      ' expected `string`.'
    );
  });

  it('should be implicitly optional and not warn without values', function() {
    typeCheckPass(LinkPropTypes.link(), null);
    typeCheckPass(LinkPropTypes.link(), undefined);
    typeCheckPass(LinkPropTypes.link(React.PropTypes.string), null);
    typeCheckPass(LinkPropTypes.link(React.PropTypes.string), undefined);
  });

  it('should warn for missing required values', function() {
    typeCheckFail(LinkPropTypes.link().isRequired, null, requiredMessage);
    typeCheckFail(LinkPropTypes.link().isRequired, undefined, requiredMessage);
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string).isRequired,
      null,
      requiredMessage
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string).isRequired,
      undefined,
      requiredMessage
    );
  });

  it('should be compatible with React.PropTypes.oneOfType', function() {
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
