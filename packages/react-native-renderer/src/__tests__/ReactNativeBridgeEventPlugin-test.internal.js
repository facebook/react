/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {traverseTwoPhase} from '../ReactNativeBridgeEventPlugin';
import {HostComponent} from 'react-reconciler/src/ReactWorkTags';

function generateHostComponentAncestors(numAncestors) {
  const child = {tag: HostComponent};

  let handle = child;
  while (numAncestors > 0) {
    const parent = {};
    parent.tag = HostComponent;
    handle.return = parent;
    handle = parent;
    numAncestors -= 1;
  }
  return child;
}

describe('ReactNativeBridgeEventPlugin', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should call capture and bubble phase', () => {
    const inst = generateHostComponentAncestors(4);
    let bubbleCount = 0;
    let capturedCount = 0;

    function dispatch(_inst, phase, event) {
      if (phase === 'bubbled') {
        bubbleCount++;
      } else if (phase === 'captured') {
        capturedCount++;
      }
    }

    traverseTwoPhase(inst, dispatch, {});

    expect(capturedCount).toEqual(5);
    expect(bubbleCount).toEqual(5);
  });

  it('should skip bubble', () => {
    const inst = generateHostComponentAncestors(0);
    let bubbleCount = 0;
    let capturedCount = 0;

    function dispatch(_inst, phase, event) {
      if (phase === 'bubbled') {
        bubbleCount++;
      } else if (phase === 'captured') {
        capturedCount++;
      }
    }

    traverseTwoPhase(inst, dispatch, {}, true);

    expect(capturedCount).toEqual(1);
    expect(bubbleCount).toEqual(0);
  });
});
