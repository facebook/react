/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

describe('escapeTextForBrowser', function() {

  var escapeTextForBrowser = require('escapeTextForBrowser');

  it('should escape boolean to string', function() {
    expect(escapeTextForBrowser(true)).toBe('true');
    expect(escapeTextForBrowser(false)).toBe('false');
  });

  it('should escape object to string', function() {
    var escaped = escapeTextForBrowser({
      toString: function() {
        return 'ponys';
      }
    });

    expect(escaped).toBe('ponys');
  });

  it('should escape number to string', function() {
    expect(escapeTextForBrowser(42)).toBe('42');
  });

  it('should escape string', function() {
    var escaped = escapeTextForBrowser('<script type=\'\' src=""></script>');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('\'');
    expect(escaped).not.toContain('\"');

    escaped = escapeTextForBrowser('&');
    expect(escaped).toBe('&amp;');
  });

});
