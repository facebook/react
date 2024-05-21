/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/src/__tests__/fixtures',
    '<rootDir>/src/__tests__/test-utils',
    '<rootDir>/dist',
    '<rootDir>/node_modules',
  ],
};

module.exports = config;
