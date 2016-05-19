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

// NOTE: We're explicitly not using JSX here. This is intended to test
// the current stack addendum without having source location added by babel.

'use strict';

var React;
var ReactTestUtils;

describe('ReactChildReconciler', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();

    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('warns for duplicated keys', function() {
    spyOn(console, 'error');

    var Component = React.createClass({
      render() {
        // <div>{[<div key="1" />, <div key="1" />]}</div>
        return React.createElement('div', null, [
          React.createElement('div', { key: '1' }),
          React.createElement('div', { key: '1' }),
        ]);
      },
    });

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      'Child keys must be unique; when two children share a key, only the first child will be used.'
    );
  });

  it('warns for duplicated keys with component stack info', function() {
    spyOn(console, 'error');

    var Component = React.createClass({
      render: function() {
        // <div>{[<div key="1" />, <div key="1" />]}</div>
        return React.createElement('div', null, [
          React.createElement('div', { key: '1' }),
          React.createElement('div', { key: '1' }),
        ]);
      },
    });

    var Parent = React.createClass({
      render: function() {
        return React.cloneElement(this.props.child);
      },
    });

    var GrandParent = React.createClass({
      render: function() {
        // <Parent child={<Component />} />
        return React.createElement(Parent, {
          child: React.createElement(Component),
        });
      },
    });

    ReactTestUtils.renderIntoDocument(React.createElement(GrandParent));

    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toBe(
      'Warning: flattenChildren(...): ' +
      'Encountered two children with the same key, `1`. ' +
      'Child keys must be unique; when two children share a key, ' +
      'only the first child will be used.\n' +
      '    in div (created by Component)\n' +
      '    in Component (created by GrandParent)\n' +
      '    in Parent (created by GrandParent)\n' +
      '    in GrandParent'
    );
  });
});
