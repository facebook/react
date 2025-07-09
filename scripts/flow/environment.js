/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Feature flags (customize as needed)
if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.__PROFILE__ === 'undefined') globalThis.__PROFILE__ = false;
  if (typeof globalThis.__EXPERIMENTAL__ === 'undefined') globalThis.__EXPERIMENTAL__ = false;
  if (typeof globalThis.__VARIANT__ === 'undefined') globalThis.__VARIANT__ = false;
}

// Polyfill for queueMicrotask
if (typeof globalThis.queueMicrotask !== 'function') {
  globalThis.queueMicrotask = function (fn) {
    Promise.resolve().then(fn);
  };
}

// Polyfill for reportError
if (typeof globalThis.reportError !== 'function') {
  globalThis.reportError = function (error) {
    setTimeout(function () { throw error; });
  };
}

// Polyfill for AggregateError
if (typeof globalThis.AggregateError === 'undefined') {
  globalThis.AggregateError = function(errors, message) {
    var err = new Error(message);
    err.name = 'AggregateError';
    err.errors = errors;
    return err;
  };
}

// Polyfill for FinalizationRegistry
if (typeof globalThis.FinalizationRegistry === 'undefined') {
  globalThis.FinalizationRegistry = function () {};
}
