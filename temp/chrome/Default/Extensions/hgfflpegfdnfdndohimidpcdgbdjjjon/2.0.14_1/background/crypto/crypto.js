/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule crypto
 */

"use strict";

/**
 * Number of bits to keep in stored bcrypt hashes.
 *
 * Excerpt from google/password-alert (https://fburl.com/133438556):
 *
 * > Why 37 bits? We were trying to balance two goals: store enough bits to
 * > prevent false positives, but few enough bits so that even if an attacker
 * > can brute-force it they won't be able to easily discern your real password.
 * > The false positive rate is such that with a 20,000 person company typing
 * > randomly for a year, you'd get one false positive. [...] Random typing
 * > isn't what people actually do, so the actual false positive rate is likely
 * > significantly lower.
 *
 * @type {number}
 */

const bcrypt = dcodeIO.bcrypt;
const HASH_BITS = 37;

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
function bufferToHex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed
    // (we process 4 bytes each time)
    var value = view.getUint32(i);

    // toString(16) will give the hex representation of the number
    // without padding
    var stringValue = value.toString(16);

    // We use concatenation and slice for padding
    var padding = '00000000';
    var paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}

/**
 * Trims `hash` to HASH_BITS
 *
 * @param {ArrayBuffer} hash
 * @return {ArrayBuffer} hash trimmed to HASH_BITS
 */
function trimHash(hash) {
  var byteOffset = Math.floor(HASH_BITS / 8);
  var remainder = HASH_BITS % 8;
  var view = new DataView(hash);
  var slice = view.getUint8(byteOffset);
  var mask = 0xff00 >> remainder;
  view.setUint32(byteOffset, slice & mask);
  for (var i = byteOffset + 4; i < view.byteLength; i += 4) {
    view.setUint32(i, 0);
  }
  return hash;
}

/**
 * Generate a salt.
 * @returns {string}
 */
function genSalt() {
  return bcrypt.genSaltSync(5);
}

/**
 * Hashes and trims a password.
 * @param {String} input
 * @param {String} salt
 * @returns {Promise.<String>}
 */
function hashPassword(input, salt) {
  // Order here is important. If we do 'input + salt' there's higher chance that
  // we expose ourselves to various forms of crypto nastiness.
  /*
  const saltedBuffer = new TextEncoder('utf8').encode(salt + input);
  */
  return new Promise(function(resolve, reject) {
    bcrypt.hash(input, salt, function(err, hash) {
      if(err) {
        reject(err);
      }
      resolve(hash.substr(29, Math.ceil(HASH_BITS / 4)));
    });
  });
}

/**
 * Constant time string comparison. Used to compare hashes of equal length!
 *
 * @param {String} compareTo
 * @returns {boolean}
 */
String.prototype.compareHash = function(compareTo) {
  var compareHash = this;
  if (typeof compareTo !== 'string') {
    reject('Invalid hash type, string expected');
  }
  if (this.length !== compareTo.length) {
    reject('Hashes being compared are of unequal length');
  }

  var result = 0;
  for (var i = 0; i < this.length; i++) {
    result |= this.charCodeAt(i) ^ compareTo.charCodeAt(i);
  }
  return result === 0;
};
