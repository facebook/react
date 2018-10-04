/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactDOMServer;
let PropTypes;
let REACT_TEXT_TYPE;

const minified = ([str]) => str.replace(/\n|\r| {2}/g, '');

const tags = [
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'audio',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
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
  'i',
  'iframe',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'main',
  'map',
  'mark',
  'menu',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'output',
  'p',
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
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'u',
  'ul',
  'var',
  'video',
  'custom-element',
];

describe('Omit optional close tags in ReactDOMServerRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    PropTypes = require('prop-types');
    ReactDOMServer = require('react-dom/server');
    REACT_TEXT_TYPE = require('shared/ReactSymbols').REACT_TEXT_TYPE;
  });

  it('recreates w3c example w3.org/TR/html5/syntax.html#example-b26c8b39', () => {
    const response = ReactDOMServer.renderToString(
      <table>
        <caption>
          37547 TEE Electric Powered Rail Car Train Functions (Abbreviated)
        </caption>
        <colgroup>
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Function</th>
            <th>Control Unit</th>
            <th>Central Station</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Headlights</td>
            <td>✔</td>
            <td>✔</td>
          </tr>
          <tr>
            <td>Interior Lights</td>
            <td>✔</td>
            <td>✔</td>
          </tr>
          <tr>
            <td>Electric locomotive operating sounds</td>
            <td>✔</td>
            <td>✔</td>
          </tr>
          <tr>
            <td>Engineer’s cab lighting</td>
            <td />
            <td>✔</td>
          </tr>
          <tr>
            <td>Station Announcements - Swiss</td>
            <td />
            <td>✔</td>
          </tr>
        </tbody>
      </table>,
    );

    expect(response).toMatch(minified`
      <table data-reactroot="">
        <caption>
          37547 TEE Electric Powered Rail Car Train Functions (Abbreviated)
        </caption>
        <colgroup><col/><col/><col/></colgroup>
        <thead>
        <tr>
          <th>Function
          <th>Control Unit
          <th>Central Station
        <tbody>
        <tr>
          <td>Headlights
          <td>✔
          <td>✔
        <tr>
          <td>Interior Lights
          <td>✔
          <td>✔
        <tr>
          <td>Electric locomotive operating sounds
          <td>✔
          <td>✔
        <tr>
          <td>Engineer’s cab lighting
          <td>
          <td>✔
        <tr>
          <td>Station Announcements - Swiss
          <td>
          <td>✔
      </table>
    `);
  });

  it('correctly omits close tags', () => {
    const parentTags = [...tags, undefined];
    const childTags = [
      ...tags,
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'keygen',
      'link',
      'menuitem',
      'meta',
      'option',
      'param',
      'source',
      'textarea',
      'track',
      'wbr',
    ];
    const secondChildTags = [...childTags, undefined, REACT_TEXT_TYPE];

    parentTags.forEach(parentTag => {
      childTags.forEach(firstChildTag => {
        secondChildTags.forEach(secondChildTag => {
          let secondChild;
          if (secondChildTag === REACT_TEXT_TYPE) {
            secondChild = 'text';
          } else if (typeof secondChildTag === 'string') {
            secondChild = React.createElement(secondChildTag, {key: 2});
          }

          const children = [
            React.createElement(firstChildTag, {key: 1}),
            secondChild,
          ];

          const response = ReactDOMServer.renderToString(
            parentTag === undefined
              ? children
              : React.createElement(parentTag, {}, children),
          );
        });
      });
    });
  });
});
