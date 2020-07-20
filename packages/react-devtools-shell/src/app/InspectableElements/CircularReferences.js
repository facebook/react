/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const arrayOne = [];
const arrayTwo = [];
arrayTwo.push(arrayOne);
arrayOne.push(arrayTwo);

const objectOne = {};
const objectTwo = {objectOne};
objectOne.objectTwo = objectTwo;

export default function CircularReferences() {
  return <ChildComponent arrayOne={arrayOne} objectOne={objectOne} />;
}

function ChildComponent(props: any) {
  return null;
}
