/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('CSSProperty', () => {
  var React = require('react');
  var ReactDOMServer = require('react-dom/server');

  it('should generate browser prefixes for its `isUnitlessNumber`', () => {
    var styles = {
      lineClamp: 10,
      WebkitLineClamp: 10,
      msFlexGrow: 10,
      MozFlexGrow: 10,
      msGridRow: 10,
      msGridRowEnd: 10,
      msGridRowSpan: 10,
      msGridRowStart: 10,
      msGridColumn: 10,
      msGridColumnEnd: 10,
      msGridColumnSpan: 10,
      msGridColumnStart: 10,
    };
    var div = <div style={styles} />;
    var html = ReactDOMServer.renderToString(div);

    expect(html).toContain(
      '"line-clamp:10;-webkit-line-clamp:10;-ms-flex-grow:10;-moz-flex-grow:10;-ms-grid-row:10;' +
        '-ms-grid-row-end:10;-ms-grid-row-span:10;-ms-grid-row-start:10;-ms-grid-column:10;' +
        '-ms-grid-column-end:10;-ms-grid-column-span:10;-ms-grid-column-start:10"',
    );
  });
});
