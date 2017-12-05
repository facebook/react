/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

// Helpers
const testAllPermutations = function(testCases) {
  for (let i = 0; i < testCases.length; i += 2) {
    const renderWithChildren = testCases[i];
    const expectedResultAfterRender = testCases[i + 1];

    for (let j = 0; j < testCases.length; j += 2) {
      const updateWithChildren = testCases[j];
      const expectedResultAfterUpdate = testCases[j + 1];

      const container = document.createElement('div');
      ReactDOM.render(<div>{renderWithChildren}</div>, container);
      expectChildren(container, expectedResultAfterRender);

      ReactDOM.render(<div>{updateWithChildren}</div>, container);
      expectChildren(container, expectedResultAfterUpdate);
    }
  }
};

const expectChildren = function(container, children) {
  const outerNode = container.firstChild;
  let textNode;
  if (typeof children === 'string') {
    textNode = outerNode.firstChild;

    if (children === '') {
      expect(textNode != null).toBe(false);
    } else {
      expect(textNode != null).toBe(true);
      expect(textNode.nodeType).toBe(3);
      expect(textNode.data).toBe('' + children);
    }
  } else {
    let mountIndex = 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (typeof child === 'string') {
        textNode = outerNode.childNodes[mountIndex];
        expect(textNode.nodeType).toBe(3);
        expect(textNode.data).toBe('' + child);
        mountIndex++;
      } else {
        const elementDOMNode = outerNode.childNodes[mountIndex];
        expect(elementDOMNode.tagName).toBe('DIV');
        mountIndex++;
      }
    }
  }
};

/**
 * ReactMultiChild DOM integration test. In ReactDOM components, we make sure
 * that single children that are strings are treated as "content" which is much
 * faster to render and update.
 */
describe('ReactMultiChildText', () => {
  it('should correctly handle all possible children for render and update', () => {
    spyOnDev(console, 'error');
    // prettier-ignore
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

      // values inside elements
      [<div>{true}{1.2}{<div />}</div>, '', 'foo'], [<div />, '', 'foo'],
      [1.2, '', <div>{<div />}{'foo'}{true}</div>], ['1.2', '', <div />],
      ['', <div>{'foo'}{<div />}{true}</div>, 1.2], ['', <div />, '1.2'],

      [true, <div>{1.2}{''}{<div />}{'foo'}</div>, true, 1.2], [<div />, '1.2'],
      ['', 'foo', <div>{true}{<div />}{1.2}{''}</div>, 'foo'], ['', 'foo', <div />, 'foo'],
    ]);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(2);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Warning: Each child in an array or iterator should have a unique "key" prop.',
      );
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'Warning: Each child in an array or iterator should have a unique "key" prop.',
      );
    }
  });

  it('should throw if rendering both HTML and children', () => {
    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <div dangerouslySetInnerHTML={{__html: 'abcdef'}}>ghjkl</div>,
      );
    }).toThrow();
  });

  it('should render between nested components and inline children', () => {
    ReactTestUtils.renderIntoDocument(
      <div>
        <h1>
          <span />
          <span />
        </h1>
      </div>,
    );

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <div>
          <h1>A</h1>
        </div>,
      );
    }).not.toThrow();

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <div>
          <h1>{['A']}</h1>
        </div>,
      );
    }).not.toThrow();

    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <div>
          <h1>{['A', 'B']}</h1>
        </div>,
      );
    }).not.toThrow();
  });
});
