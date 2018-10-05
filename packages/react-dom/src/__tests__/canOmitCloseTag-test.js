/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

import {REACT_TEXT_TYPE} from 'shared/ReactSymbols';
import canOmitCloseTag from '../shared/canOmitCloseTag';

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
  'custom-element',
  undefined,
];

expect.extend({
  toOmitCloseTag(tag, nextSibling, parent) {
    const pass = canOmitCloseTag(tag, nextSibling, parent);
    if (pass) {
      return {
        message: () =>
          `expected ${tag} to have close tag with next sibling '${nextSibling}' and parent 'div'`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${tag} not to have close tag with next sibling '${nextSibling}' and parent 'div'`,
        pass: false,
      };
    }
  },
});

const itOmitsWithNextSiblings = (tag, matchingNextSiblings) => {
  it(`correctly omits ${tag}`, () => {
    [...tags, REACT_TEXT_TYPE].forEach(nextSibling => {
      if (matchingNextSiblings.includes(nextSibling)) {
        expect(tag).toOmitCloseTag(nextSibling, 'div');
      } else {
        expect(tag).not.toOmitCloseTag(nextSibling, 'div');
      }
    });
  });
};

describe('canOmitCloseTag', () => {
  itOmitsWithNextSiblings('li', ['li', undefined]);

  itOmitsWithNextSiblings('dt', ['dt', 'dd']);

  itOmitsWithNextSiblings('dd', ['dd', 'dt', undefined]);

  itOmitsWithNextSiblings('p', [
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
    undefined,
  ]);

  it('correctly omits p for specific parent tags', () => {
    const notAllowedParents = [
      undefined,
      'a',
      'audio',
      'del',
      'ins',
      'map',
      'noscript',
      'video',
      'custom-element',
    ];

    tags.forEach(parent => {
      if (notAllowedParents.includes(parent)) {
        expect('p').not.toOmitCloseTag(undefined, parent);
      } else {
        expect('p').toOmitCloseTag(undefined, parent);
      }
    });
  });

  itOmitsWithNextSiblings('rt', ['rt', 'rp', undefined]);

  itOmitsWithNextSiblings('rp', ['rp', 'rt', undefined]);

  itOmitsWithNextSiblings('optgroup', ['optgroup', undefined]);

  itOmitsWithNextSiblings('option', ['option', 'optgroup', undefined]);

  itOmitsWithNextSiblings('colgroup', []);

  itOmitsWithNextSiblings('caption', []);

  itOmitsWithNextSiblings('thead', ['tbody', 'tfoot']);

  itOmitsWithNextSiblings('tbody', ['tbody', 'tfoot', undefined]);

  itOmitsWithNextSiblings('tfoot', [undefined]);

  itOmitsWithNextSiblings('tr', ['tr', undefined]);

  itOmitsWithNextSiblings('td', ['td', 'th', undefined]);

  itOmitsWithNextSiblings('th', ['th', undefined]);
});
