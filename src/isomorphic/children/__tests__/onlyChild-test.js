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

describe('onlyChild', function() {

  let React;
  let ReactFragment;
  let onlyChild;
  let WrapComponent;

  beforeEach(function() {
    React = require('React');
    ReactFragment = require('ReactFragment');
    onlyChild = require('onlyChild');
    WrapComponent = React.createClass({
      render: function() {
        return (
          <div>
            {onlyChild(this.props.children, this.props.mapFn, this)}
          </div>
        );
      },
    });
  });

  it('should fail when passed two children', function() {
    expect(function() {
      const instance =
        <WrapComponent>
          <div />
          <span />
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();
  });

  it('should fail when passed nully values', function() {
    expect(function() {
      const instance =
        <WrapComponent>
          {null}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();

    expect(function() {
      const instance =
        <WrapComponent>
          {undefined}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();
  });

  it('should fail when key/value objects', function() {
    expect(function() {
      const instance =
        <WrapComponent>
          {ReactFragment.create({oneThing: <span />})}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();
  });


  it('should not fail when passed interpolated single child', function() {
    expect(function() {
      const instance =
        <WrapComponent>
          {<span />}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).not.toThrow();
  });


  it('should return the only child', function() {
    expect(function() {
      const instance =
        <WrapComponent>
          <span />
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).not.toThrow();
  });

});
