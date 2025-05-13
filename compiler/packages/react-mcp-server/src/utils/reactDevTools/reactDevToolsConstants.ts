/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Flip this flag to true to enable verbose console debug logging.
export const __DEBUG__ = false;

// Tree operation constants
export const TREE_OPERATION_ADD = 1;
export const TREE_OPERATION_REMOVE = 2;
export const TREE_OPERATION_REORDER_CHILDREN = 3;
export const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
export const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
export const TREE_OPERATION_REMOVE_ROOT = 6;
export const TREE_OPERATION_SET_SUBTREE_MODE = 7;

// Profiling constants
export const PROFILING_FLAG_BASIC_SUPPORT = 0b01;
export const PROFILING_FLAG_TIMELINE_SUPPORT = 0b10;
