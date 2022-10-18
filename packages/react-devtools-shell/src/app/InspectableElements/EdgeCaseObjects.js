/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
// $FlowFixMe[prop-missing] found when upgrading Flow
objectWithNullProto.foo = 'abc';
// $FlowFixMe[prop-missing] found when upgrading Flow
objectWithNullProto.bar = 123;

export default function EdgeCaseObjects(): React.Node {
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
