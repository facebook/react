/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule rollingAdler32
 */

'use strict';

var MOD = 65521;

// adler32 is not cryptographically strong, and is only used to sanity check that
// markup generated on the server matches the markup generated on the client.
// This implementation (a modified version of the SheetJS version) has been optimized
// for our use case, at the expense of conforming to the adler32 specification
// for non-ascii inputs.
// UPDATE August 3, 2015: this is a rolling version of adler32 which is used for a streaming
// version of React.renderToString. It is not trying to implement adler32 precisely, but rather to
// mirror the React adler32 implementation. It's to be used as follows:
//
// var rollingHash = rollingAdler32(data); // note that there is only one argument; this means start a new hash.
// var moreData = getSomeMoreData();
// rollingHash = rollingAdler32(moreData, rollingHash);
// // keep getting more data and sending it in to rollingAdler32.
// // when you need to get the hash:
// var finalHash = rollingHash.hash();

function hash() {
  this.a %= MOD;
  this.b %= MOD;
  return this.a | (this.b << 16);
}

function rollingAdler32(data, rollingHash) {
  var a = 1;
  var b = 0;
  if (rollingHash) {
    if (typeof rollingHash.a === 'undefined' || typeof rollingHash.b === 'undefined') {
      throw new Error('A corrupt rollingHash was passed in to rollingAdler32');
    }
    a = rollingHash.a;
    b = rollingHash.b;
  }
  var i = 0;
  var l = data.length;
  var m = l & ~0x3;
  while (i < m) {
    for (; i < Math.min(i + 4096, m); i += 4) {
      b += (
        (a += data.charCodeAt(i)) +
        (a += data.charCodeAt(i + 1)) +
        (a += data.charCodeAt(i + 2)) +
        (a += data.charCodeAt(i + 3))
      );
    }
    a %= MOD;
    b %= MOD;
  }
  for (; i < l; i++) {
    b += (a += data.charCodeAt(i));
  }

  a %= MOD;
  b %= MOD;

  return {
    a: a,
    b: b,
    hash: hash,
  };
}

module.exports = rollingAdler32;
