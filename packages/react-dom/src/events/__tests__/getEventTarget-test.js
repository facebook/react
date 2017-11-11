/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var getEventTarget = require('../getEventTarget').default;

describe('getEventTarget', () => {
    describe('when target is present in nativeEvent', () => {
        it('returns target', () => {
            var target = document.createElement('div');
            expect(getEventTarget({target: target})).toBe(target);
        });
    });

    describe('when srcElement is present in nativeEvent', () => {
        it('returns srcElement', () => {
            var target = document.createElement('div');
            expect(getEventTarget({srcElement: target})).toBe(target);
        });
    });

    describe('when neither target nor srcElement is present in nativeEvent', () => {
        it('returns the window object', () => {
            expect(getEventTarget({})).toBe(window);
        });
    });

    describe('when correspondingUseElement is present in target in nativeEvent', () => {
        it('returns srcElement', () => {
            var correspondingUseElement = document.createElement('div');
            expect(getEventTarget({target: {correspondingUseElement: correspondingUseElement}})).toBe(correspondingUseElement);
        });
    });

    describe('when target is a text node', () => {
        it('returns the parent element', () => {
            var parent = document.createElement('div');
            var child = document.createTextNode('');
            parent.appendChild(child);
            expect(getEventTarget({target: child})).toBe(parent);
        });
    });
});