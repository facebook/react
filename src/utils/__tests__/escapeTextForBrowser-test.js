/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    expect(escaped).not.toContain('/');
    expect(escaped).not.toContain('\"');

    escaped = escapeTextForBrowser('&');
    expect(escaped).toBe('&amp;');
  });

});
