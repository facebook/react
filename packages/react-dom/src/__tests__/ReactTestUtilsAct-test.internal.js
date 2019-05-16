/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let ReactFeatureFlags;
let act;
describe('mocked scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.warnAboutMissingMockScheduler = true;
    jest.unmock('scheduler');
    act = require('react-dom/test-utils').act;
  });
  it("should warn when the scheduler isn't mocked", () => {
    expect(() => act(() => {})).toWarnDev(
      [
        'Starting from React v17, the "scheduler" module will need to be mocked',
      ],
      {withoutStack: true},
    );
  });
});
