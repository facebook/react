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

function expectInvalidNestingWarning(shouldWarn, tagsList, warningsList = []) {
  let element = null;
  let tags = tagsList;
  if (__DEV__) {
    console.error.calls.reset();
  }
  const container = document.createElement(tags.splice(0, 1));
  while (tags.length) {
    element = React.createElement(tags.pop(), null, element);
  }
  ReactDOM.render(element, container);

  if (__DEV__) {
    let warnings = warningsList;
    if (shouldWarn) {
      expect(console.error.calls.count()).toEqual(warningsList.length);
      while (warnings.length) {
        expect(
          normalizeCodeLocInfo(
            console.error.calls.argsFor(warnings.length - 1)[0],
          ),
        ).toContain(warnings.pop());
      }
    } else {
      expect(console.error.calls.count()).toEqual(0);
    }
  }
}

describe('validateDOMNesting', () => {
  it('allows valid nestings', () => {
    spyOnDev(console, 'error');
    expectInvalidNestingWarning(false, ['table', 'tbody', 'tr', 'td', 'b']);
    expectInvalidNestingWarning(false, ['div', 'a', 'object', 'a']);
    expectInvalidNestingWarning(false, ['div', 'p', 'button', 'p']);
    expectInvalidNestingWarning(false, ['p', 'svg', 'foreignObject', 'p']);
    expectInvalidNestingWarning(false, ['html', 'body', 'div']);

    // Invalid, but not changed by browser parsing so we allow them
    expectInvalidNestingWarning(false, ['div', 'ul', 'ul', 'li']);
    expectInvalidNestingWarning(false, ['div', 'label', 'div']);
    expectInvalidNestingWarning(false, ['div', 'ul', 'li', 'section', 'li']);
    expectInvalidNestingWarning(false, ['div', 'ul', 'li', 'dd', 'li']);
  });

  it('prevents problematic nestings', () => {
    spyOnDev(console, 'error');
    expectInvalidNestingWarning(
      true,
      ['body', 'datalist', 'option'],
      [
        'render(): Rendering components directly into document.body is discouraged',
      ],
    );
    expectInvalidNestingWarning(
      true,
      ['table', 'tr'],
      ['validateDOMNesting(...): <tr> cannot appear as a child of <table>'],
    );
    expectInvalidNestingWarning(
      true,
      ['p', 'p'],
      ['validateDOMNesting(...): <p> cannot appear as a descendant of <p>'],
    );
    expectInvalidNestingWarning(
      true,
      ['div', 'ul', 'li', 'div', 'li'],
      ['validateDOMNesting(...): <li> cannot appear as a descendant of <li>'],
    );
    expectInvalidNestingWarning(
      true,
      ['div', 'html'],
      ['validateDOMNesting(...): <html> cannot appear as a child of <div>'],
    );
    expectInvalidNestingWarning(
      true,
      ['body', 'body'],
      [
        'render(): Rendering components directly into document.body is discouraged',
        'validateDOMNesting(...): <body> cannot appear as a child of <body>',
      ],
    );
    expectInvalidNestingWarning(
      true,
      ['svg', 'foreignObject', 'body', 'p'],
      [
        'validateDOMNesting(...): <body> cannot appear as a child of <foreignObject>',
        '<foreignObject /> is using uppercase HTML',
      ],
    );
    expectInvalidNestingWarning(
      true,
      ['a', 'a'],
      ['validateDOMNesting(...): <a> cannot appear as a descendant of <a>'],
    );
    expectInvalidNestingWarning(
      true,
      ['form', 'form'],
      [
        'validateDOMNesting(...): <form> cannot appear as a descendant of <form>',
      ],
    );
  });
});
