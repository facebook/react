/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const objectWithModifiedHasOwnProperty = {
  foo: 'abc',
  bar: 123,
  hasOwnProperty: true,
};

const objectWithNullProto = Object.create(null);
objectWithNullProto.foo = 'abc';
objectWithNullProto.bar = 123;

export default function EdgeCaseObjects() {
  return (
    <ChildComponent
      objectWithModifiedHasOwnProperty={objectWithModifiedHasOwnProperty}
      objectWithNullProto={objectWithNullProto}
    />
  );
}

function ChildComponent(props: any) {
  return null;
}
