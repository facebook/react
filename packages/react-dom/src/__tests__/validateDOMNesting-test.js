/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactDOMClient = require('react-dom/client');

function expectWarnings(tags, warnings = [], withoutStack = 0) {
  tags = [...tags];
  warnings = [...warnings];

  let element = null;
  const containerTag = tags.shift();
  const container =
    containerTag === 'svg'
      ? document.createElementNS('http://www.w3.org/2000/svg', containerTag)
      : document.createElement(containerTag);

  while (tags.length) {
    const Tag = tags.pop();
    element = <Tag>{element}</Tag>;
  }

  const root = ReactDOMClient.createRoot(container);
  if (warnings.length) {
    expect(() => {
      ReactDOM.flushSync(() => {
        root.render(element);
      });
    }).toErrorDev(warnings, {
      withoutStack,
    });
  }
}

describe('validateDOMNesting', () => {
  it('allows valid nestings', () => {
    expectWarnings(['table', 'tbody', 'tr', 'td', 'b']);
    expectWarnings(['body', 'datalist', 'option']);
    expectWarnings(['div', 'a', 'object', 'a']);
    expectWarnings(['div', 'p', 'button', 'p']);
    expectWarnings(['p', 'svg', 'foreignObject', 'p']);
    expectWarnings(['html', 'body', 'div']);

    // Invalid, but not changed by browser parsing so we allow them
    expectWarnings(['div', 'ul', 'ul', 'li']);
    expectWarnings(['div', 'label', 'div']);
    expectWarnings(['div', 'ul', 'li', 'section', 'li']);
    expectWarnings(['div', 'ul', 'li', 'dd', 'li']);
  });

  it('prevents problematic nestings', () => {
    expectWarnings(
      ['a', 'a'],
      [
        'In HTML, <a> cannot be a descendant of <a>.\n' +
          'This will cause a hydration error.\n' +
          '    in a (at **)',
      ],
    );
    expectWarnings(
      ['form', 'form'],
      [
        'In HTML, <form> cannot be a descendant of <form>.\n' +
          'This will cause a hydration error.\n' +
          '    in form (at **)',
      ],
    );
    expectWarnings(
      ['p', 'p'],
      [
        'In HTML, <p> cannot be a descendant of <p>.\n' +
          'This will cause a hydration error.\n' +
          '    in p (at **)',
      ],
    );
    expectWarnings(
      ['table', 'tr'],
      [
        'In HTML, <tr> cannot be a child of <table>. ' +
          'Add a <tbody>, <thead> or <tfoot> to your code to match the DOM tree generated by the browser.\n' +
          'This will cause a hydration error.\n' +
          '    in tr (at **)',
      ],
    );
    expectWarnings(
      ['div', 'ul', 'li', 'div', 'li'],
      gate(flags => flags.enableOwnerStacks)
        ? [
            'In HTML, <li> cannot be a descendant of <li>.\n' +
              'This will cause a hydration error.\n' +
              '\n' +
              '  <ul>\n' +
              '-   <li>\n' +
              '      <div>\n' +
              '-       <li>\n' +
              '\n' +
              '    in li (at **)',
            '<li> cannot contain a nested <li>.\nSee this log for the ancestor stack trace.\n' +
              '    in li (at **)',
          ]
        : [
            'In HTML, <li> cannot be a descendant of <li>.\n' +
              'This will cause a hydration error.\n' +
              '\n' +
              '  <ul>\n' +
              '-   <li>\n' +
              '      <div>\n' +
              '-       <li>\n' +
              '\n' +
              '    in li (at **)\n' +
              '    in div (at **)\n' +
              '    in li (at **)\n' +
              '    in ul (at **)',
          ],
    );
    expectWarnings(
      ['div', 'html'],
      [
        'In HTML, <html> cannot be a child of <div>.\n' +
          'This will cause a hydration error.\n' +
          '    in html (at **)',
      ],
    );
    expectWarnings(
      ['body', 'body'],
      [
        'In HTML, <body> cannot be a child of <body>.\n' +
          'This will cause a hydration error.\n' +
          '    in body (at **)',
      ],
    );
    expectWarnings(
      ['svg', 'foreignObject', 'body', 'p'],
      gate(flags => flags.enableOwnerStacks)
        ? [
            // TODO, this should say "In SVG",
            'In HTML, <body> cannot be a child of <foreignObject>.\n' +
              'This will cause a hydration error.\n' +
              '\n' +
              '- <foreignObject>\n' +
              '-   <body>\n' +
              '\n' +
              '    in body (at **)',
            'You are mounting a new body component when a previous one has not first unmounted. It is an error to render more than one body component at a time and attributes and children of these components will likely fail in unpredictable ways. Please only render a single instance of <body> and if you need to mount a new one, ensure any previous ones have unmounted first.\n' +
              '    in body (at **)',
          ]
        : [
            // TODO, this should say "In SVG",
            'In HTML, <body> cannot be a child of <foreignObject>.\n' +
              'This will cause a hydration error.\n' +
              '\n' +
              '- <foreignObject>\n' +
              '-   <body>\n' +
              '\n' +
              '    in body (at **)\n' +
              '    in foreignObject (at **)',
            'You are mounting a new body component when a previous one has not first unmounted. It is an error to render more than one body component at a time and attributes and children of these components will likely fail in unpredictable ways. Please only render a single instance of <body> and if you need to mount a new one, ensure any previous ones have unmounted first.\n' +
              '    in body (at **)',
          ],
    );
  });
});
