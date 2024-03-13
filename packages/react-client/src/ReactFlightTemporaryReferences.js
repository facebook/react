/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

interface Reference {}

export opaque type TemporaryReferenceSet = Array<Reference>;

export function createTemporaryReferenceSet(): TemporaryReferenceSet {
  return [];
}

export function writeTemporaryReference(
  set: TemporaryReferenceSet,
  object: Reference,
): number {
  // We always create a new entry regardless if we've already written the same
  // object. This ensures that we always generate a deterministic encoding of
  // each slot in the reply for cacheability.
  const newId = set.length;
  set.push(object);
  return newId;
}

export function readTemporaryReference(
  set: TemporaryReferenceSet,
  id: number,
): Reference {
  if (id < 0 || id >= set.length) {
    throw new Error(
      "The RSC response contained a reference that doesn't exist in the temporary reference set. " +
        'Always pass the matching set that was used to create the reply when parsing its response.',
    );
  }
  return set[id];
}
