/**
 * Copyright 2013 Facebook, Inc.
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

/*jslint evil: true */

"use strict";

var React = require('React');

describe('CSSPropertyOperations', function() {
  var CSSPropertyOperations;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    CSSPropertyOperations = require('CSSPropertyOperations');
  });

  it('should create markup for simple styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: '#3b5998',
      display: 'none'
    })).toBe('background-color:#3b5998;display:none;');
  });

  it('should ignore undefined styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: undefined,
      display: 'none'
    })).toBe('display:none;');
  });

  it('should ignore null styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: null,
      display: 'none'
    })).toBe('display:none;');
  });

  it('should return null for no styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      backgroundColor: null,
      display: null
    })).toBe(null);
  });

  it('should automatically append `px` to relevant styles', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      left: 0,
      margin: 16,
      opacity: 0.5,
      padding: '4px'
    })).toBe('left:0;margin:16px;opacity:0.5;padding:4px;');
  });

  it('should not append `px` to styles that might need a number', function() {
    expect(CSSPropertyOperations.createMarkupForStyles({
      fillOpacity: 1,
      fontWeight: 2,
      opacity: 3,
      orphans: 4,
      zIndex: 5,
      zoom: 6,
      lineHeight: 7
    })).toBe(
      'fill-opacity:1;font-weight:2;opacity:3;orphans:4;z-index:5;zoom:6;' +
      'line-height:7;'
    );
  });

  it('should set style attribute when styles exist', function() {
    var styles = {
      backgroundColor: '#000',
      display: 'none'
    };
    var div = <div style={styles} />;
    var root = document.createElement('div');
    React.renderComponent(div, root);
    expect(/style=".*"/.test(root.innerHTML)).toBe(true);
  });

  it('should not set style attribute when no styles exist', function() {
    var styles = {
      backgroundColor: null,
      display: null
    };
    var div = <div style={styles} />;
    var root = document.createElement('div');
    React.renderComponent(div, root);
    expect(/style=".*"/.test(root.innerHTML)).toBe(false);
  });

});
