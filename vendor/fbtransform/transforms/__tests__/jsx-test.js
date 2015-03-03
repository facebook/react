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

require('mock-modules').autoMockOff();

describe('jsx', function() {
  var jsx = require('../jsx');
  var utils = require('jstransform/src/utils');
  var esprima = require('esprima-fb');

  function runWithLiteral(text, isLast) {
    var source = '<div>' + text + '</div>';
    var ast = esprima.parse(source, { range: true });
    var state = utils.createState(source);
    var literal = ast.body[0].expression.children[0];
    state.g.position = literal.range[0];
    jsx.renderJSXLiteral(literal, isLast, state);
    return state;
  }

  function runWithAttribute(inlineAttribute, isLast) {
    var source = '<div ' + inlineAttribute + ' />';
    var ast = esprima.parse(source, { range: true });
    var state = utils.createState(source);
    var attribute = ast.body[0].expression.openingElement.attributes[0];
    state.g.position = attribute.value.range[0];
    jsx.renderJSXExpressionContainer(
      function() {},
      attribute.value,
      isLast,
      [],
      state
    );
    return state;
  }

  it('should render simple literal', function() {
    var state = runWithLiteral('a', true);
    expect(state.g.buffer).toEqual('"a"');
  });


  it('should render simple literal with single space before', function() {
    var state = runWithLiteral(' a', true);
    expect(state.g.buffer).toEqual('" a"');
  });

  it('should render simple literal with single space before' +
      ' from multiple spaces', function() {
    var state = runWithLiteral(' \t  a', true);
    expect(state.g.buffer).toEqual('"    a"');
  });

  it('should render simple literal with single space after', function() {
    var state = runWithLiteral('a ', true);
    expect(state.g.buffer).toEqual('"a "');
  });

  it('should render simple literal with single space after' +
      ' from multiple spaces', function() {
    var state = runWithLiteral('a  \t \t ', true);
    expect(state.g.buffer).toEqual('"a      "');
  });

  it('should render multiline literal as last', function() {
    var state = runWithLiteral(
      '  sdfsdfsdf\n' +
      '  sdlkfjsdfljs\n' +
      '   ',
      true);

    expect(state.g.buffer).toEqual(
      '"  sdfsdfsdf" + \' \' +\n' +
      '  "sdlkfjsdfljs"\n' +
      '   ');
  });

  it('should render multiline literal as not last', function() {
    var state = runWithLiteral(
      '  sdfsdfsdf\n' +
      '  sdlkfjsdfljs\n' +
      '   ',
      false);

    expect(state.g.buffer).toEqual(
      '"  sdfsdfsdf" + \' \' +\n' +
      '  "sdlkfjsdfljs", \n' +
      '   ');
  });

  it('should render attribute expressions', function() {
    var state = runWithAttribute('attr={"foo"}', true);
    expect(state.g.buffer).toEqual('"foo"');
  });

  it('should render attribute expressions as not last', function() {
    var state = runWithAttribute('attr={"foo"}', false);
    expect(state.g.buffer).toEqual('"foo", ');
  });

  it('should render attribute expressions with spaces', function() {
    var state = runWithAttribute('attr={ "foo"\n }', true);
    expect(state.g.buffer).toEqual(' "foo"\n ');
  });

  it('should render attribute expressions with commas before trailing ' +
      'whitespace', function() {
    var state = runWithAttribute('attr={\n"foo"\n }', false);
    expect(state.g.buffer).toEqual('\n"foo", \n ');
  });

  it('should render empty child expressions with comments', function() {
    var source = '<div>{/*comment*/}</div>';
    var ast = esprima.parse(source, {range: true});
    var child = ast.body[0].expression.children[0];
    var state = utils.createState(source, child);
    state.g.position = child.range[0];
    jsx.renderJSXExpressionContainer(function() {}, child, true, [], state);
    expect(state.g.buffer).toBe('/*comment*/');
  });

  it('should not render commas after empty child expressions even if they\'re' +
     'not last', function() {
    var source = '<div>{/*comment*/}</div>';
    var ast = esprima.parse(source, {range: true});
    var child = ast.body[0].expression.children[0];
    var state = utils.createState(source, child);
    state.g.position = child.range[0];
    jsx.renderJSXExpressionContainer(function() {}, child, false, [], state);
    expect(state.g.buffer).toBe('/*comment*/');
  });
});
