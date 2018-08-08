/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMMutationResilience', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  // Simulates what Google Translate (and likely others) do
  // https://github.com/facebook/react/issues/11538
  const replaceTextNodesWithDOMElements = container => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );
    let node;
    let nodes = [];
    while ((node = walker.nextNode())) {
      nodes.push(node);
    }
    while ((node = nodes.pop())) {
      const fontEl = document.createElement('font');
      fontEl.style.verticalAlign = 'middle';
      fontEl.textContent = node.textContent.toUpperCase();
      node.replaceWith(fontEl);
      // For debugging the test suite:
      node.__replacedElement = fontEl;
    }
  };

  const simulateRender = children => {
    let expectedResultAfterRender = [];
    React.Children.forEach(children, child => {
      if (child == null) {
        return;
      }
      expectedResultAfterRender.push(
        typeof child === 'number' ? child.toString() : child,
      );
    });
    return expectedResultAfterRender;
  };

  const simulateMutation = (initialChildren, nextChildren) => {
    const container = document.createElement('div');
    ReactDOM.render(<div>{initialChildren}</div>, container);

    const textNodeWalker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );
    let node;
    while ((node = textNodeWalker.nextNode())) {
      (function() {
        let initV = node.nodeValue;
        Object.defineProperty(node, 'nodeValue', {
          get() {
            return initV;
          },
          set(v) {},
        });
      })();
    }
    ReactDOM.render(<div>{nextChildren}</div>, container);

    let result = [];
    for (let i = 0; i < container.firstChild.childNodes.length; i++) {
      node = container.firstChild.childNodes[i];
      if (node.nodeType === 3) {
        result.push(node.textContent);
      } else {
        result.push(React.createElement(node.tagName.toLowerCase()));
      }
    }
    return result;
  };

  const testAllPermutations = testCases => {
    for (let i = 0; i < testCases.length; i++) {
      const renderWithChildren = testCases[i];

      for (let j = 0; j < testCases.length; j++) {
        const updateWithChildren = testCases[j];
        const container = document.createElement('div');

        if (!Array.isArray(updateWithChildren)) {
          // Don't check updates to a primitive because
          // they work through setTextContent().
          continue;
        }

        // Initial render
        const expectedResultAfterRender = simulateRender(renderWithChildren);
        ReactDOM.render(<div>{renderWithChildren}</div>, container);
        expectNormalizedChildren(container, expectedResultAfterRender);
        // First mutation
        replaceTextNodesWithDOMElements(container);
        expectNormalizedChildren(container, expectedResultAfterRender);

        // Update
        const expectedResultAfterUpdateConsideringMutation = simulateMutation(
          renderWithChildren,
          updateWithChildren,
        );
        ReactDOM.render(<div>{updateWithChildren}</div>, container);
        expectNormalizedChildren(
          container,
          expectedResultAfterUpdateConsideringMutation,
        );
        // Second mutation
        replaceTextNodesWithDOMElements(container);
        expectNormalizedChildren(
          container,
          expectedResultAfterUpdateConsideringMutation,
        );
      }
    }
  };

  const expectNormalizedChildren = function(container, children) {
    const outerNode = container.firstChild;
    let node;
    if (typeof children === 'string') {
      node = outerNode.firstChild;

      if (children === '') {
        expect(node != null).toBe(false);
      } else {
        expect(node != null).toBe(true);
        // Ignore the simulated mutation:
        const normalizedTextContext = node.textContent.toLowerCase();
        expect(normalizedTextContext).toBe('' + children);
      }
    } else {
      let mountIndex = 0;

      if (children.length === 1 && children[0] === '') {
        expect(outerNode.textContent).toBe('');
        return;
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (typeof child === 'string') {
          node = outerNode.childNodes[mountIndex];
          // Ignore the simulated mutation:
          const normalizedTextContext = node.textContent.toLowerCase();
          expect(normalizedTextContext).toBe('' + child);
          mountIndex++;
        } else {
          const elementDOMNode = outerNode.childNodes[mountIndex];
          expect(elementDOMNode.tagName).toBe('DIV');
          mountIndex++;
        }
      }
    }
  };

  it('recovers when updating a single text child', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div>{'aaa'}</div>, container);
    expect(container.textContent).toBe('aaa');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAA');

    ReactDOM.render(<div>{'bbb'}</div>, container);
    expect(container.textContent).toBe('bbb');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('BBB');

    ReactDOM.render(<div>{'ccc'}</div>, container);
    expect(container.textContent).toBe('ccc');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('CCC');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers replacing a single text child', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div>{'aaa'}</div>, container);
    expect(container.textContent).toBe('aaa');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAA');

    ReactDOM.render(
      <div>
        <span>{'bbb'}</span>
      </div>,
      container,
    );
    expect(container.textContent).toBe('bbb');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('BBB');

    ReactDOM.render(<div>{'ccc'}</div>, container);
    expect(container.textContent).toBe('ccc');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('CCC');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers removing a single text child', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div>{'aaa'}</div>, container);
    expect(container.textContent).toBe('aaa');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAA');

    ReactDOM.render(<div />, container);
    expect(container.textContent).toBe('');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers when updating a single text child out of many', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <div>
        {'aaa'}
        {'mmm'}
        {'xxx'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('aaammmxxx');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAMMMXXX');

    ReactDOM.render(
      <div>
        {'aaa'}
        {'nnn'}
        {'xxx'}
      </div>,
      container,
    );
    // Our reference to the second child is detached
    // so it's no longer expected to update correctly.
    // Nevertheless we continue without errors.
    expect(container.textContent).toBe('AAAMMMXXX');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAMMMXXX');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers replacing a single text child out of many', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <div>
        {'aaa'}
        {'mmm'}
        {'xxx'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('aaammmxxx');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAMMMXXX');

    ReactDOM.render(
      <div>
        {'aaa'}
        <span>{'nnn'}</span>
        {'xxx'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('AAAnnnXXX');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAANNNXXX');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers removing a single text child out of many', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <div>
        {'aaa'}
        {'mmm'}
        {'xxx'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('aaammmxxx');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAMMMXXX');

    ReactDOM.render(
      <div>
        {'aaa'}
        {null}
        {'xxx'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('AAAXXX');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAXXX');

    ReactDOM.render(<div />, container);
    expect(container.textContent).toBe('');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers when appending a child before text', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <div>
        {null}
        {'xxx'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('xxx');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('XXX');

    ReactDOM.render(
      <div>
        <span>{'aaa'}</span>
        {'yyy'}
      </div>,
      container,
    );
    // Our reference to the second child is detached
    // so it's no longer expected to update correctly.
    // Nevertheless we continue without errors.
    expect(container.textContent).toBe('aaaXXX');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAXXX');

    ReactDOM.render(
      <div>
        <span>{'bbb'}</span>
        {'zzz'}
      </div>,
      container,
    );
    expect(container.textContent).toBe('bbbXXX');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('BBBXXX');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers when appending a child before text and element', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <div>
        <span>{'aaa'}</span>
        {null}
        {'mmm'}
        <span>{'xxx'}</span>
      </div>,
      container,
    );
    expect(container.textContent).toBe('aaammmxxx');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAAMMMXXX');

    ReactDOM.render(
      <div>
        <span>{'bbb'}</span>
        {'fff'}
        {'nnn'}
        <span>{'yyy'}</span>
      </div>,
      container,
    );
    // Our references to the third child is detached
    // so it's no longer expected to update correctly.
    // Nevertheless we continue without errors.
    expect(container.textContent).toBe('bbbfffMMMyyy');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('BBBFFFMMMYYY');

    ReactDOM.render(
      <div>
        <span>{'ccc'}</span>
        {'ggg'}
        {'ooo'}
        <span>{'zzz'}</span>
      </div>,
      container,
    );
    // Our references to the second and third children are detached
    // so they're no longer expected to update correctly.
    // Nevertheless we continue without errors.
    expect(container.textContent).toBe('cccFFFMMMzzz');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('CCCFFFMMMZZZ');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('recovers when appending a child after text', () => {
    const container = document.createElement('div');
    ReactDOM.render(<div>{'aaa'}</div>, container);
    expect(container.textContent).toBe('aaa');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('AAA');

    ReactDOM.render(
      <div>
        {'bbb'}
        <span>{'xxx'}</span>
      </div>,
      container,
    );
    expect(container.textContent).toBe('bbbxxx');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('BBBXXX');

    ReactDOM.render(
      <div>
        {'ccc'}
        <span>{'zzz'}</span>
      </div>,
      container,
    );
    // Our reference to the first child is detached
    // so it's no longer expected to update correctly.
    // Nevertheless we continue without errors.
    expect(container.textContent).toBe('BBBzzz');
    replaceTextNodesWithDOMElements(container);
    expect(container.textContent).toBe('BBBZZZ');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('should correctly handle all possible children for render and update', () => {
    expect(() => {
      // prettier-ignore
      testAllPermutations([
        // basic values
        undefined,
        null,
        false,
        true,
        0,
        1.2,
        '',
        'foo',

        [],
        [undefined],
        [null],
        [false],
        [true],
        [0],
        [1.2],
        [''],
        ['foo'],
        [<div />],

        // two adjacent values
        [true, 0],
        [0, 0],
        [1.2, 0],
        [0, ''],
        ['foo', 0],
        [0, <div />],

        [true, 1.2],
        [1.2, 0],
        [1.2, 1.2],
        [1.2, ''],
        ['foo', 1.2],
        [1.2, <div />],

        [true, ''],
        ['', 0],
        [1.2, ''],
        ['', ''],
        ['foo', ''],
        ['', <div />],

        [true, 'foo'],
        ['foo', 0],
        [1.2, 'foo'],
        ['foo', ''],
        ['foo', 'foo'],
        ['foo', <div />],

        // values separated by an element
        [true, <div />, true],
        [1.2, <div />, 1.2],
        ['', <div />, ''],
        ['foo', <div />, 'foo'],

        [true, 1.2, <div />, ''],
        [true, 1.2, <div />, '', 'foo'],
        [1.2, '', <div />, 'foo', true],
        ['', 'foo', <div />, true, 1.2],

        [true, 1.2, '', <div />, 'foo', true, 1.2],
        ['', 'foo', true, <div />, 1.2, '', 'foo'],

        // values inside arrays
        [[true], [true]],
        [[1.2], [1.2]],
        [[''], ['']],
        [['foo'], ['foo']],
        [[<div />], [<div />]],

        [[true, 1.2, <div />], '', 'foo'],
        [1.2, '', [<div />, 'foo', true]],
        ['', ['foo', <div />, true], 1.2],

        [true, [1.2, '', <div />, 'foo'], true, 1.2],
        ['', 'foo', [true, <div />, 1.2, ''], 'foo'],

        // values inside elements
        [<div>{true}{1.2}{<div />}</div>, '', 'foo'],
        [1.2, '', <div>{<div />}{'foo'}{true}</div>],
        ['', <div>{'foo'}{<div />}{true}</div>, 1.2],

        [true, <div>{1.2}{''}{<div />}{'foo'}</div>, true, 1.2],
        ['', 'foo', <div>{true}{<div />}{1.2}{''}</div>, 'foo'],
      ]);
    }).toWarnDev([
      'Warning: Each child in an array or iterator should have a unique "key" prop.',
      'Warning: Each child in an array or iterator should have a unique "key" prop.',
    ]);
  });
});
