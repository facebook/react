/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

import canOmitCloseTag from '../shared/canOmitCloseTag';
import {isAutonomousCustomComponent} from '../shared/isCustomComponent';

const tags = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'pre',
  'progress',
  'q',
  'rb',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
  'custom-component',
  null,
];

const testCanOmitCloseTag = (tagName, nextSiblings) => {
  tags.forEach(tag => {
    expect(canOmitCloseTag(tagName, tag, null)).toBe(
      !!nextSiblings.includes(tag),
    );
  });
};

describe('canOmitCloseTag', () => {
  it('correctly omits li', () => {
    testCanOmitCloseTag('li', ['li', null]);
  });

  it('correctly omits dt', () => {
    testCanOmitCloseTag('dt', ['dt', 'dd']);
  });

  it('correctly omits dd', () => {
    testCanOmitCloseTag('dd', ['dd', 'dt', null]);
  });

  it('correctly omits p', () => {
    testCanOmitCloseTag('p', [
      'address',
      'article',
      'aside',
      'blockquote',
      'details',
      'div',
      'dl',
      'fieldset',
      'figcaption',
      'figure',
      'footer',
      'form',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'header',
      'hr',
      'main',
      'nav',
      'ol',
      'p',
      'pre',
      'section',
      'table',
      'ul',
    ]);

    tags.forEach(tag => {
      const notAllowedParents = [
        null,
        'a',
        'audio',
        'del',
        'ins',
        'map',
        'noscript',
        'video',
      ];
      expect(canOmitCloseTag('p', null, tag)).toBe(
        !(notAllowedParents.includes(tag) || isAutonomousCustomComponent(tag)),
      );
    });
  });

  it('correctly omits rt', () => {
    testCanOmitCloseTag('rt', ['rt', 'rp', null]);
  });

  it('correctly omits rp', () => {
    testCanOmitCloseTag('rp', ['rp', 'rt', null]);
  });

  it('correctly omits optgroup', () => {
    testCanOmitCloseTag('optgroup', ['optgroup', null]);
  });

  it('correctly omits option', () => {
    testCanOmitCloseTag('option', ['option', 'optgroup', null]);
  });

  it('correctly omits colgroup', () => {
    testCanOmitCloseTag('colgroup', []);
  });

  it('correctly omits caption', () => {
    testCanOmitCloseTag('caption', []);
  });

  it('correctly omits thead', () => {
    testCanOmitCloseTag('thead', ['tbody', 'tfoot']);
  });

  it('correctly omits tbody', () => {
    testCanOmitCloseTag('tbody', ['tbody', 'tfoot', null]);
  });

  it('correctly omits tfoot', () => {
    testCanOmitCloseTag('tfoot', [null]);
  });

  it('correctly omits tr', () => {
    testCanOmitCloseTag('tr', ['tr', null]);
  });

  it('correctly omits td', () => {
    testCanOmitCloseTag('td', ['td', 'th', null]);
  });

  it('correctly omits th', () => {
    testCanOmitCloseTag('th', ['th', null]);
  });
});
