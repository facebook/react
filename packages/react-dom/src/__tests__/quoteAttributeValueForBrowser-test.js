/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('quoteAttributeValueForBrowser', () => {
  // TODO: can we express this test with only public API?
  var quoteAttributeValueForBrowser = require('../shared/quoteAttributeValueForBrowser');

  it('should escape boolean to string', () => {
    expect(quoteAttributeValueForBrowser(true)).toBe('"true"');
    expect(quoteAttributeValueForBrowser(false)).toBe('"false"');
  });

  it('should escape object to string', () => {
    var escaped = quoteAttributeValueForBrowser({
      toString: function() {
        return 'ponys';
      },
    });

    expect(escaped).toBe('"ponys"');
  });

  it('should escape number to string', () => {
    expect(quoteAttributeValueForBrowser(42)).toBe('"42"');
  });

  it('should escape string', () => {
    var escaped = quoteAttributeValueForBrowser(
      '<script type=\'\' src=""></script>',
    );
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain("'");
    expect(escaped.substr(1, -1)).not.toContain('"');

    escaped = quoteAttributeValueForBrowser('&');
    expect(escaped).toBe('"&amp;"');
  });
});
