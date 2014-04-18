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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

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
  expect(error).toBe(undefined);
}

describe('ReactLink', function() {
  it('should fail if the argument does not implement the Link API', function() {
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {},
      'Required prop `value` was not specified in `testComponent`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {value: 123},
      'Required prop `requestChange` was not specified in `testComponent`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {requestChange: emptyFunction},
      'Required prop `value` was not specified in `testComponent`.'
    );
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.any),
      {value: null, requestChange: null},
      'Required prop `value` was not specified in `testComponent`.'
    );
  });

  it('should allow valid links even if no type was specified', function() {
    typeCheckPass(
      LinkPropTypes.link(),
      {value: 42, requestChange: emptyFunction}
    );
    typeCheckPass(
      LinkPropTypes.link(),
      {value: {}, requestChange: emptyFunction
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
      LinkPropTypes.link(React.PropTypes.renderable),
      {value: 42, requestChange: emptyFunction}
    );
  });

  it('should fail if the link`s value type does not match', function() {
    typeCheckFail(
      LinkPropTypes.link(React.PropTypes.string),
      {value: 123, requestChange: emptyFunction},
      'Invalid prop `value` of type `number` supplied to `testComponent`,' +
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
      'Invalid prop `value` supplied to `testComponent`.'
    );
  });
});
