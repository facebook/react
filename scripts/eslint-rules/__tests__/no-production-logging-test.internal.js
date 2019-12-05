/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-production-logging');
const RuleTester = require('eslint').RuleTester;
const ruleTester = new RuleTester();

ruleTester.run("no-production-logging", rule, {
	valid: [
		{
			code: "if (__DEV__) {consoleLog(test)}",
		},
		{
			code: "if (__DEV__) {consoleError(test)}",
		},
		{
			code: "if (__DEV__) { if (potato) { while (true) { consoleError(test) }}}",
		},
		{
			code: "normalFunctionCall(test)",
		},
		{
			code: "if (__DEV__) {normalFunctionCall(test)}",
		},
	],
	invalid: [
		{
			code: "consoleLog(test)",
			errors: [
				{
					message: "Wrap consoleLog in a `if (__DEV__)` check",
				},
			],
		},
		{
			code: "if (potato) {consoleLog(test)}",
			errors: [
				{
					message: "Wrap consoleLog in a `if (__DEV__)` check",
				},
			],
		},
		{
			code: "consoleError(test)",
			errors: [
				{
					message: "Wrap consoleError in a `if (__DEV__)` check",
				},
			],
		},
	],
});
