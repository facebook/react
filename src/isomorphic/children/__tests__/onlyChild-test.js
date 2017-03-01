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

describe('onlyChild', () => {

  var React;
  var ReactFragment;
  var onlyChild;
  var WrapComponent;

  beforeEach(() => {
    React = require('react');
    ReactFragment = require('ReactFragment');
    onlyChild = require('onlyChild');
    WrapComponent = class extends React.Component {
      render() {
        return (
          <div>
            {onlyChild(this.props.children, this.props.mapFn, this)}
          </div>
        );
      }
    };
  });

  it('should fail when passed two children', () => {
    expect(function() {
      var instance =
        <WrapComponent>
          <div />
          <span />
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();
  });

  it('should fail when passed nully values', () => {
    expect(function() {
      var instance =
        <WrapComponent>
          {null}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();

    expect(function() {
      var instance =
        <WrapComponent>
          {undefined}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();
  });

  it('should fail when key/value objects', () => {
    expect(function() {
      var instance =
        <WrapComponent>
          {ReactFragment.create({oneThing: <span />})}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).toThrow();
  });


  it('should not fail when passed interpolated single child', () => {
    expect(function() {
      var instance =
        <WrapComponent>
          {<span />}
        </WrapComponent>;
      onlyChild(instance.props.children);
    }).not.toThrow();
  });

  it('should return the only child', () => {
    var instance =
      <WrapComponent>
        <span />
      </WrapComponent>;
    expect(onlyChild(instance.props.children)).toEqual(<span />);
  });

});
