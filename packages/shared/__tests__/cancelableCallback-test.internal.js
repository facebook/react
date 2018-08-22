/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @flow
 */
'use strict';

import makeCancelableCallback from 'shared/cancelableCallback';

jest.useFakeTimers();
const TIMEOUT_TIME = 5000;
const DELTA_TIME = 1000;

describe('cancelableCallback', () => {
  it("call the callback if the callback isn't canceled", done => {
    // given
    const callback = jest.fn();
    const cancelableCallback = makeCancelableCallback(callback);
    const asyncProcess = () =>
      setTimeout(cancelableCallback.callback, TIMEOUT_TIME);

    // when
    asyncProcess();
    expect(callback).not.toBeCalled();

    // then
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
      done();
    }, TIMEOUT_TIME + DELTA_TIME);
    // calls expect
    jest.runTimersToTime(TIMEOUT_TIME);
    // calls done
    jest.runTimersToTime(DELTA_TIME);
  });
  it('short circuit the callback if the callback is canceled', done => {
    // given
    const callback = jest.fn();
    const cancelableCallback = makeCancelableCallback(callback);
    const asyncProcess = () =>
      setTimeout(cancelableCallback.callback, TIMEOUT_TIME);

    // when
    asyncProcess();
    expect(callback).not.toBeCalled();

    // then
    setTimeout(() => {
      expect(callback).not.toHaveBeenCalled();
      done();
    }, TIMEOUT_TIME + DELTA_TIME);
    // calls expect
    jest.runTimersToTime(DELTA_TIME);
    cancelableCallback.cancel();
    jest.runTimersToTime(TIMEOUT_TIME - DELTA_TIME);
    // calls done
    jest.runTimersToTime(DELTA_TIME);
  });
});
