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

const minified = ([str]) => str.replace(/\n|\r| {2}/g, '');

describe('Omit optional close tags in ReactDOMServerRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    PropTypes = require('prop-types');
    ReactDOMServer = require('react-dom/server');
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
});
