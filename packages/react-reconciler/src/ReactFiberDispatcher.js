/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {readContext} from './ReactFiberNewContext';
import {
  useAPI,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useMutationEffect,
  useReducer,
  useRef,
  useState,
} from './ReactFiberHooks';

export const Dispatcher = {
  readContext,
  useAPI,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useMutationEffect,
  useReducer,
  useRef,
  useState,
};
