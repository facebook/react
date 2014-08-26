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

/*jslint evil: true */

"use strict";

require('mock-modules');

var React = require('React');
var ReactTestUtils = require('ReactTestUtils');

var reactComponentExpect = require('reactComponentExpect');

// Helpers
var testAllPermutations = function(testCases) {
  for (var i = 0; i < testCases.length; i += 2) {
    var renderWithChildren = testCases[i];
    var expectedResultAfterRender = testCases[i + 1];

    for (var j = 0; j < testCases.length; j += 2) {
      var updateWithChildren = testCases[j];
      var expectedResultAfterUpdate = testCases[j + 1];

      var d = renderChildren(renderWithChildren);
      expectChildren(d, expectedResultAfterRender);

      updateChildren(d, updateWithChildren);
      expectChildren(d, expectedResultAfterUpdate);
    }
  }
};

var renderChildren = function(children) {
  return ReactTestUtils.renderIntoDocument(
    <div>{children}</div>
  );
};

var updateChildren = function(d, children) {
  d.replaceProps({children: children});
};

var expectChildren = function(d, children) {
  if (typeof children === 'string') {
    var textNode = d.getDOMNode().firstChild;

    if (children === '') {
      expect(textNode != null).toBe(false);
    } else {
      expect(textNode != null).toBe(true);
      expect(textNode.nodeType).toBe(3);
      expect(textNode.data).toBe('' + children);
    }
  } else {
    expect(d.getDOMNode().childNodes.length).toBe(children.length);

    for (var i = 0; i < children.length; i++) {
      var child = children[i];

      if (typeof child === 'string') {
        var textWrapperNode =
          reactComponentExpect(d)
            .expectRenderedChildAt(i)
            .toBeTextComponent()
            .instance();

        expectChildren(textWrapperNode, child);
      } else {
        var elementDOMNode =
          reactComponentExpect(d)
            .expectRenderedChildAt(i)
            .toBeComponentOfType(React.DOM.div)
            .instance()
            .getDOMNode();

        expect(elementDOMNode.tagName).toBe('DIV');
      }
    }
  }
};


/**
 * ReactMultiChild DOM integration test. In ReactDOM components, we make sure
 * that single children that are strings are treated as "content" which is much
 * faster to render and update.
 */
describe('ReactMultiChildText', function() {
  it('should correctly handle all possible children for render and update', function() {
    testAllPermutations([
      // basic values
      undefined, [],
      null, [],
      false, [],
      true, [],
      0, '0',
      1.2, '1.2',
      '', '',
      'foo', 'foo',

      [], [],
      [undefined], [],
      [null], [],
      [false], [],
      [true], [],
      [0], ['0'],
      [1.2], ['1.2'],
      [''], [''],
      ['foo'], ['foo'],
      [<div />], [<div />],

      // two adjacent values
      [true, 0], ['0'],
      [0, 0], ['0', '0'],
      [1.2, 0], ['1.2', '0'],
      [0, ''], ['0', ''],
      ['foo', 0], ['foo', '0'],
      [0, <div />], ['0', <div />],

      [true, 1.2], ['1.2'],
      [1.2, 0], ['1.2', '0'],
      [1.2, 1.2], ['1.2', '1.2'],
      [1.2, ''], ['1.2', ''],
      ['foo', 1.2], ['foo', '1.2'],
      [1.2, <div />], ['1.2', <div />],

      [true, ''], [''],
      ['', 0], ['', '0'],
      [1.2, ''], ['1.2', ''],
      ['', ''], ['', ''],
      ['foo', ''], ['foo', ''],
      ['', <div />], ['', <div />],

      [true, 'foo'], ['foo'],
      ['foo', 0], ['foo', '0'],
      [1.2, 'foo'], ['1.2', 'foo'],
      ['foo', ''], ['foo', ''],
      ['foo', 'foo'], ['foo', 'foo'],
      ['foo', <div />], ['foo', <div />],

      // values separated by an element
      [true, <div />, true], [<div />],
      [1.2, <div />, 1.2], ['1.2', <div />, '1.2'],
      ['', <div />, ''], ['', <div />, ''],
      ['foo', <div />, 'foo'], ['foo', <div />, 'foo'],

      [true, 1.2, <div />, '', 'foo'], ['1.2', <div />, '', 'foo'],
      [1.2, '', <div />, 'foo', true], ['1.2', '', <div />, 'foo'],
      ['', 'foo', <div />, true, 1.2], ['', 'foo', <div />, '1.2'],

      [true, 1.2, '', <div />, 'foo', true, 1.2], ['1.2', '', <div />, 'foo', '1.2'],
      ['', 'foo', true, <div />, 1.2, '', 'foo'], ['', 'foo', <div />, '1.2', '', 'foo'],

      // values inside arrays
      [[true], [true]], [],
      [[1.2], [1.2]], ['1.2', '1.2'],
      [[''], ['']], ['', ''],
      [['foo'], ['foo']], ['foo', 'foo'],
      [[<div />], [<div />]], [<div />, <div />],

      [[true, 1.2, <div />], '', 'foo'], ['1.2', <div />, '', 'foo'],
      [1.2, '', [<div />, 'foo', true]], ['1.2', '', <div />, 'foo'],
      ['', ['foo', <div />, true], 1.2], ['', 'foo', <div />, '1.2'],

      [true, [1.2, '', <div />, 'foo'], true, 1.2], ['1.2', '', <div />, 'foo', '1.2'],
      ['', 'foo', [true, <div />, 1.2, ''], 'foo'], ['', 'foo', <div />, '1.2', '', 'foo'],

      // values inside objects
      [{a: true}, {a: true}], [],
      [{a: 1.2}, {a: 1.2}], ['1.2', '1.2'],
      [{a: ''}, {a: ''}], ['', ''],
      [{a: 'foo'}, {a: 'foo'}], ['foo', 'foo'],
      [{a: <div />}, {a: <div />}], [<div />, <div />],

      [{a: true, b: 1.2, c: <div />}, '', 'foo'], ['1.2', <div />, '', 'foo'],
      [1.2, '', {a: <div />, b: 'foo', c: true}], ['1.2', '', <div />, 'foo'],
      ['', {a: 'foo', b: <div />, c: true}, 1.2], ['', 'foo', <div />, '1.2'],

      [true, {a: 1.2, b: '', c: <div />, d: 'foo'}, true, 1.2], ['1.2', '', <div />, 'foo', '1.2'],
      ['', 'foo', {a: true, b: <div />, c: 1.2, d: ''}, 'foo'], ['', 'foo', <div />, '1.2', '', 'foo'],

      // values inside elements
      [<div>{true}{1.2}{<div />}</div>, '', 'foo'], [<div />, '', 'foo'],
      [1.2, '', <div>{<div />}{'foo'}{true}</div>], ['1.2', '', <div />],
      ['', <div>{'foo'}{<div />}{true}</div>, 1.2], ['', <div />, '1.2'],

      [true, <div>{1.2}{''}{<div />}{'foo'}</div>, true, 1.2], [<div />, '1.2'],
      ['', 'foo', <div>{true}{<div />}{1.2}{''}</div>, 'foo'], ['', 'foo', <div />, 'foo']
    ]);
  });

  it('should throw if rendering both HTML and children', function() {
    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <div dangerouslySetInnerHTML={{_html: 'abcdef'}}>ghjkl</div>
      );
    }).toThrow();
  });

  it('should render between nested components and inline children', function() {
    var container = document.createElement('div');
    React.renderComponent(<div><h1><span /><span /></h1></div>, container);

    expect(function() {
      React.renderComponent(<div><h1>A</h1></div>, container);
    }).not.toThrow();

    React.renderComponent(<div><h1><span /><span /></h1></div>, container);

    expect(function() {
      React.renderComponent(<div><h1>{['A']}</h1></div>, container);
    }).not.toThrow();

    React.renderComponent(<div><h1><span /><span /></h1></div>, container);

    expect(function() {
      React.renderComponent(<div><h1>{['A', 'B']}</h1></div>, container);
    }).not.toThrow();
  });
});
