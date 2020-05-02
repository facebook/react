/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';

export default function PostGlimmer() {
  return (
    <div
      style={{
        border: '1px solid #aaa',
        borderRadius: 10,
        marginBottom: 20,
        padding: 20,
        maxWidth: 500,
        height: 180,
      }}>
      <div
        style={{
          marginBottom: 20,
          width: '50%',
          height: 20,
          background: '#ddd',
        }}
      />
      <div
        style={{
          marginBottom: 20,
          width: '60%',
          height: 20,
          background: '#eee',
        }}
      />
      <div
        style={{
          marginBottom: 20,
          width: '50%',
          height: 20,
          background: '#eee',
        }}
      />
      <div
        style={{
          marginBottom: 20,
          width: '60%',
          height: 20,
          background: '#eee',
        }}
      />
    </div>
  );
}
