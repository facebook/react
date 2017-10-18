/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

var ReactNativePropRegistry = require('ReactNativePropRegistry');

var register = ReactNativePropRegistry.register;
var getByID = ReactNativePropRegistry.getByID;
var unregister = ReactNativePropRegistry.unregister;
var devOnlyIt = __DEV__ ? it : it.skip;

describe('ReactNativePropRegistry', () => {
	describe('register', () => {
		it('should return an integer', () => {
			expect(typeof register({})).toBe('number');
		});

		it('should not return the same integer across different calls', () => {
			var a = register({});
			var b = register({});

			expect(b).not.toBe(a);
		});

		devOnlyIt('should freeze the input object in __DEV__ mode', () => {
			var object = {a: 1};
			register(object);
			expect(() => {
				object.a = 2;
			}).toThrowErrorMatchingSnapshot();
		});
	});

	describe('getByID', () => {
		it('should return an empty object when passed undefined, null, false, or 0', () => {
			expect(getByID(undefined)).toEqual({});
			expect(getByID(null)).toEqual({});
			expect(getByID(false)).toEqual({});
			expect(getByID(0)).toEqual({});
		});

		it('should warn and return an empty object when passed an unknown id', () => {
			var spy = spyOn(console, 'warn');
			expect(getByID(999999999999999)).toEqual({});
			expect(spy).toHaveBeenCalledWith('Invalid style with id `999999999999999`. Skipping ...');
		});

		it('should warn and return an empty object when passed an id for an unregistered object', () => {
			var spy = spyOn(console, 'warn');
			var object = {a: 1};
			var id = register(object);
			unregister(id);
			expect(getByID(id)).toEqual({});
			expect(spy).toHaveBeenCalledWith('Style with id `' + id + '` has been unregistered. Skipping ...');
		});

		it('should return an object registered with register', () => {
			var object = {a: 1};
			var id = register(object);
			expect(getByID(id)).toBe(object);
		});
	});

	describe('unregister', () => {
		it('should unregister objects so getByID does not return them', () => {
			spyOn(console, 'warn');
			var object = {a: 1};
			var id = register(object);
			unregister(id);
			var result = getByID(id);
			expect(result).not.toBe(object);
			expect(result).toEqual({});
		});
	});
});
