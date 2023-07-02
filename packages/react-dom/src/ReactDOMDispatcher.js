/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const PrefetchDNSOptions = {};
const PreconnectOptions = {crossOrigin: undefined};
const PreloadOptions = {
  as: undefined,
  crossOrigin: undefined,
  integrity: undefined,
  type: undefined,
};

const PreinitOptions = {
  as: undefined,
  precedence: undefined,
  crossOrigin: undefined,
  integrity: undefined,
  nonce: undefined,
};

const HostDispatcher = {
  prefetchDNS: function(href, options) {},
  preconnect: function(href, options) {},
  preload: function(href, options) {},
  preinit: function(href, options) {},
};

module.exports = {
  PrefetchDNSOptions,
  PreconnectOptions,
  PreloadOptions,
  PreinitOptions,
  HostDispatcher,
};
