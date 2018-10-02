/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

import canOmitEndTag from '../shared/canOmitEndTag';
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

const testCanOmitEndTag = (tagName, nextSiblings) => {
  tags.forEach(tag => {
    expect(canOmitEndTag(tagName, tag, null)).toBe(
      !!nextSiblings.includes(tag),
    );
  });
};

describe('canOmitEndTag', () => {
  it('correctly omits li', () => {
    testCanOmitEndTag('li', ['li', null]);
  });

  it('correctly omits dt', () => {
    testCanOmitEndTag('dt', ['dt', 'dd']);
  });

  it('correctly omits dd', () => {
    testCanOmitEndTag('dd', ['dd', 'dt', null]);
  });

  it('correctly omits p', () => {
    testCanOmitEndTag('p', [
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
      expect(canOmitEndTag('p', null, tag)).toBe(
        !(notAllowedParents.includes(tag) || isAutonomousCustomComponent(tag)),
      );
    });
  });

  it('correctly omits rt', () => {
    testCanOmitEndTag('rt', ['rt', 'rp', null]);
  });

  it('correctly omits rp', () => {
    testCanOmitEndTag('rp', ['rp', 'rt', null]);
  });

  it('correctly omits optgroup', () => {
    testCanOmitEndTag('optgroup', ['optgroup', null]);
  });

  it('correctly omits option', () => {
    testCanOmitEndTag('option', ['option', 'optgroup', null]);
  });

  it('correctly omits colgroup', () => {
    testCanOmitEndTag('colgroup', []);
  });

  it('correctly omits caption', () => {
    testCanOmitEndTag('caption', []);
  });

  it('correctly omits thead', () => {
    testCanOmitEndTag('thead', ['tbody', 'tfoot']);
  });

  it('correctly omits tbody', () => {
    testCanOmitEndTag('tbody', ['tbody', 'tfoot', null]);
  });

  it('correctly omits tfoot', () => {
    testCanOmitEndTag('tfoot', [null]);
  });

  it('correctly omits tr', () => {
    testCanOmitEndTag('tr', ['tr', null]);
  });

  it('correctly omits td', () => {
    testCanOmitEndTag('td', ['td', 'th', null]);
  });

  it('correctly omits th', () => {
    testCanOmitEndTag('th', ['th', null]);
  });
});
