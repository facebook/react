/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import monkeyPatchEvents from '../monkeyPatchEvents';

describe('monkeyPatchEvents', () => {
  const originalMutationObserver = window.MutationObsrever;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  beforeEach(() => {
    monkeyPatchEvents();
  });
  afterEach(() => {
    window.MutationObsrever = originalMutationObserver;
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  it('patches MutationObserver', done => {
    expect(window.event).toBe(undefined);
    const observer = new MutationObserver(() => {
      expect(window.event).toEqual({type: 'MutationObserver'});
      done();
    });
    const div = document.createElement('div');
    observer.observe(div, {
      childList: true,
    });
    div.textContent = 'changed';
  });

  it('patches requestAnimationFrame', done => {
    const id = requestAnimationFrame(() => {
      expect(window.event).toEqual({type: 'requestAnimationFrame'});
      done();
    });
    expect(id).not.toBe(null);
  });
});
