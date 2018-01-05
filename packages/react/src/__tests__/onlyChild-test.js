/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('onlyChild', () => {
  let React;
  let WrapComponent;

  beforeEach(() => {
    React = require('react');
    WrapComponent = class extends React.Component {
      render() {
        return (
          <div>
            {React.Children.only(this.props.children, this.props.mapFn, this)}
          </div>
        );
      }
    };
  });

  it('should fail when passed two children', () => {
    expect(function() {
      const instance = (
        <WrapComponent>
          <div />
          <span />
        </WrapComponent>
      );
      React.Children.only(instance.props.children);
    }).toThrow();
  });

  it('should fail when passed nully values', () => {
    expect(function() {
      const instance = <WrapComponent>{null}</WrapComponent>;
      React.Children.only(instance.props.children);
    }).toThrow();

    expect(function() {
      const instance = <WrapComponent>{undefined}</WrapComponent>;
      React.Children.only(instance.props.children);
    }).toThrow();
  });

  it('should fail when key/value objects', () => {
    expect(function() {
      const instance = <WrapComponent>{[<span key="abc" />]}</WrapComponent>;
      React.Children.only(instance.props.children);
    }).toThrow();
  });

  it('should not fail when passed interpolated single child', () => {
    expect(function() {
      const instance = <WrapComponent>{<span />}</WrapComponent>;
      React.Children.only(instance.props.children);
    }).not.toThrow();
  });

  it('should return the only child', () => {
    const instance = (
      <WrapComponent>
        <span />
      </WrapComponent>
    );
    expect(React.Children.only(instance.props.children)).toEqual(<span />);
  });

  it('should check for number of children if passed second parameter', () => {
    const instance = (
      <WrapComponent>
        <span />
        <span />
        <span />
      </WrapComponent>
    );

    expect(React.Children.only(instance.props.children, 3)).toEqual([
      <span />,
      <span />,
      <span />,
    ]);
  });

  it('should throw if incorrect number of children are passed', () => {
    const instance = (
      <WrapComponent>
        <span />
        <span />
      </WrapComponent>
    );

    expect(function() {
      React.Children.only(instance.props.children, 3);
    }).toThrow();
  });

  it('should fail when passed some null/undefined values', () => {
    let instance = (
      <WrapComponent>
        <span />
        {null}
        <span />
      </WrapComponent>
    );

    expect(function() {
      React.Children.only(instance.props.children, 3);
    }).toThrow();

    instance = (
      <WrapComponent>
        <span />
        {undefined}
      </WrapComponent>
    );

    expect(function() {
      React.Children.only(instance.props.children, 2);
    }).toThrow();
  });
});
