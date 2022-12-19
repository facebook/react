/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * Unicode-Base64 Codec.
 *
 * @see https://base64.guru/developers/javascript/examples/unicode-strings
 * @see https://github.com/vuejs/core/pull/3662/
 */
export const codec = {
  utoa(data: string): string {
    return btoa(unescape(encodeURIComponent(data)));
  },

  /**
   * @returns undefined if @base64 is not a valid Base64 string.
   */
  atou(base64: string): string {
    return decodeURIComponent(escape(atob(base64)));
  },
};
