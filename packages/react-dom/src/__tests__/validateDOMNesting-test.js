/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

function expectInvalidNestingWarning(tags, warnings = []) {
  tags = [...tags];
  warnings = [...warnings];

  let element = null;
  if (__DEV__) {
    console.error.calls.reset();
  }
  const container = document.createElement(tags.splice(0, 1));
  while (tags.length) {
    element = React.createElement(tags.pop(), null, element);
  }
  ReactDOM.render(element, container);

  if (__DEV__) {
    expect(console.error.calls.count()).toEqual(warnings.length);
    while (warnings.length) {
      expect(
        normalizeCodeLocInfo(
          console.error.calls.argsFor(warnings.length - 1)[0],
        ),
      ).toContain(warnings.pop());
    }
  }
}

describe('validateDOMNesting', () => {
  it('allows valid nestings', () => {
    spyOnDev(console, 'error');
    expectInvalidNestingWarning(['table', 'tbody', 'tr', 'td', 'b']);
    expectInvalidNestingWarning(['div', 'a', 'object', 'a']);
    expectInvalidNestingWarning(['div', 'p', 'button', 'p']);
    expectInvalidNestingWarning(['p', 'svg', 'foreignObject', 'p']);
    expectInvalidNestingWarning(['html', 'body', 'div']);

    // Invalid, but not changed by browser parsing so we allow them
    expectInvalidNestingWarning(['div', 'ul', 'ul', 'li']);
    expectInvalidNestingWarning(['div', 'label', 'div']);
    expectInvalidNestingWarning(['div', 'ul', 'li', 'section', 'li']);
    expectInvalidNestingWarning(['div', 'ul', 'li', 'dd', 'li']);
  });

  it('prevents problematic nestings', () => {
    spyOnDev(console, 'error');
    expectInvalidNestingWarning(
      ['body', 'datalist', 'option'],
      [
        'render(): Rendering components directly into document.body is discouraged',
      ],
    );
    expectInvalidNestingWarning(
      ['table', 'tr'],
      ['validateDOMNesting(...): <tr> cannot appear as a child of <table>'],
    );
    expectInvalidNestingWarning(
      ['p', 'p'],
      ['validateDOMNesting(...): <p> cannot appear as a descendant of <p>'],
    );
    expectInvalidNestingWarning(
      ['div', 'ul', 'li', 'div', 'li'],
      ['validateDOMNesting(...): <li> cannot appear as a descendant of <li>'],
    );
    expectInvalidNestingWarning(
      ['div', 'html'],
      ['validateDOMNesting(...): <html> cannot appear as a child of <div>'],
    );
    expectInvalidNestingWarning(
      ['body', 'body'],
      [
        'render(): Rendering components directly into document.body is discouraged',
        'validateDOMNesting(...): <body> cannot appear as a child of <body>',
      ],
    );
    expectInvalidNestingWarning(
      ['svg', 'foreignObject', 'body', 'p'],
      [
        'validateDOMNesting(...): <body> cannot appear as a child of <foreignObject>',
        '<foreignObject /> is using uppercase HTML',
      ],
    );
    expectInvalidNestingWarning(
      ['a', 'a'],
      ['validateDOMNesting(...): <a> cannot appear as a descendant of <a>'],
    );
    expectInvalidNestingWarning(
      ['form', 'form'],
      [
        'validateDOMNesting(...): <form> cannot appear as a descendant of <form>',
      ],
    );
  });
});
