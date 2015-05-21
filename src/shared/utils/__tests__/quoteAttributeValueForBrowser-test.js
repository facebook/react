/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('quoteAttributeValueForBrowser', function() {

  var quoteAttributeValueForBrowser = require('quoteAttributeValueForBrowser');

  it('should escape boolean to string', function() {
    expect(quoteAttributeValueForBrowser(true)).toBe('"true"');
    expect(quoteAttributeValueForBrowser(false)).toBe('"false"');
  });

  it('should escape object to string', function() {
    var escaped = quoteAttributeValueForBrowser({
      toString: function() {
        return 'ponys';
      }
    });

    expect(escaped).toBe('"ponys"');
  });

  it('should escape number to string', function() {
    expect(quoteAttributeValueForBrowser(42)).toBe('"42"');
  });

  it('should escape string', function() {
    var escaped = quoteAttributeValueForBrowser('<script type=\'\' src=""></script>');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('\'');
    expect(escaped.substr(1, -1)).not.toContain('\"');

    escaped = quoteAttributeValueForBrowser('&');
    expect(escaped).toBe('"&amp;"');
  });

});
