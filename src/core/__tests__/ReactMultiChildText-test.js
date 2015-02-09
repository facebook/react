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

/*jslint evil: true */

'use strict';

require('mock-modules');

var React = require('React');
var ReactFragment = require('ReactFragment');
var ReactTestUtils = require('ReactTestUtils');

var reactComponentExpect = require('reactComponentExpect');

var frag = ReactFragment.create;

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
  var textNode;
  if (typeof children === 'string') {
    textNode = d.getDOMNode().firstChild;

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
        reactComponentExpect(d)
          .expectRenderedChildAt(i)
          .toBeTextComponentWithValue(child);

        textNode = d.getDOMNode().childNodes[i].firstChild;

        if (child === '') {
          expect(textNode != null).toBe(false);
        } else {
          expect(textNode != null).toBe(true);
          expect(textNode.nodeType).toBe(3);
          expect(textNode.data).toBe('' + child);
        }
      } else {
        var elementDOMNode =
          reactComponentExpect(d)
            .expectRenderedChildAt(i)
            .toBeComponentOfType('div')
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
      [frag({a: true}), frag({a: true})], [],
      [frag({a: 1.2}), frag({a: 1.2})], ['1.2', '1.2'],
      [frag({a: ''}), frag({a: ''})], ['', ''],
      [frag({a: 'foo'}), frag({a: 'foo'})], ['foo', 'foo'],
      [frag({a: <div />}), frag({a: <div />})], [<div />, <div />],

      [frag({a: true, b: 1.2, c: <div />}), '', 'foo'], ['1.2', <div />, '', 'foo'],
      [1.2, '', frag({a: <div />, b: 'foo', c: true})], ['1.2', '', <div />, 'foo'],
      ['', frag({a: 'foo', b: <div />, c: true}), 1.2], ['', 'foo', <div />, '1.2'],

      [true, frag({a: 1.2, b: '', c: <div />, d: 'foo'}), true, 1.2], ['1.2', '', <div />, 'foo', '1.2'],
      ['', 'foo', frag({a: true, b: <div />, c: 1.2, d: ''}), 'foo'], ['', 'foo', <div />, '1.2', '', 'foo'],

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
    ReactTestUtils.renderIntoDocument(<div><h1><span /><span /></h1></div>);

    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><h1>A</h1></div>);
    }).not.toThrow();

    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><h1>{['A']}</h1></div>);
    }).not.toThrow();

    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><h1>{['A', 'B']}</h1></div>);
    }).not.toThrow();
  });
});
