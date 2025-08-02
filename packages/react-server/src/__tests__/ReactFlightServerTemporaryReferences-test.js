/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let ReactFlightServerTemporaryReferences;

describe('ReactFlightServerTemporaryReferences', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFlightServerTemporaryReferences = require('react-server/src/ReactFlightServerTemporaryReferences');
  });

  it('can return a temporary reference from an async function', async () => {
    const temporaryReferenceSet =
      ReactFlightServerTemporaryReferences.createTemporaryReferenceSet();
    const temporaryReference =
      ReactFlightServerTemporaryReferences.createTemporaryReference(
        temporaryReferenceSet,
        'test',
      );

    async function foo() {
      return temporaryReference;
    }

    await expect(foo()).resolves.toBe(temporaryReference);
  });
});
