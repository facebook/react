/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('escapeTextContentForBrowser', () => {
  // TODO: can we express this test with only public API?
  var escapeTextContentForBrowser = require('escapeTextContentForBrowser');

  it('should escape boolean to string', () => {
    expect(escapeTextContentForBrowser(true)).toBe('true');
    expect(escapeTextContentForBrowser(false)).toBe('false');
  });

  it('should escape object to string', () => {
    var escaped = escapeTextContentForBrowser({
      toString: function() {
        return 'ponys';
      },
    });

    expect(escaped).toBe('ponys');
  });

  it('should escape number to string', () => {
    expect(escapeTextContentForBrowser(42)).toBe('42');
  });

  it('should escape string', () => {
    var escaped = escapeTextContentForBrowser(
      '<script type=\'\' src=""></script>',
    );
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain("'");
    expect(escaped).not.toContain('"');

    escaped = escapeTextContentForBrowser('&');
    expect(escaped).toBe('&amp;');
  });
});
