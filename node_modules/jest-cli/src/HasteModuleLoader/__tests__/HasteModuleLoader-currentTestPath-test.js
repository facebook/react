/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

describe('nodeHasteModuleLoader', function() {
    describe('currentTestPath', function() {
        it('makes the current test path available', function() {
            expect(jest.currentTestPath()).toMatch(/currentTestPath-test/);
        });
    });
});