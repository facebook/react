/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactFiberCommitWork
 * @flow
 */

'use strict';

import type { Fiber } from 'ReactFiber';

var ReactTypeOfWork = require('ReactTypeOfWork');
var {
  ClassComponent,
  HostContainer,
  HostComponent,
} = ReactTypeOfWork;

exports.commitWork = function(finishedWork : Fiber) : void {
  switch (finishedWork.tag) {
    case ClassComponent:
      // TODO: Fire componentDidMount/componentDidUpdate, update refs
      return;
    case HostContainer:
      // TODO: Attach children to root container.
      return;
    case HostComponent:
      console.log('commit updates to host component', finishedWork.type);
      return;
    default:
      throw new Error('This unit of work tag should not have side-effects.');
  }
};
