/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse} from '@babel/parser';
import {getHookNamesFromAST} from '../astUtils';

function expectHookNamesToEqual(map, expectedNamesTuples) {
  // Slightly hacky since it relies on the iterable order of values()
  const expectedNamesArray = expectedNamesTuples.map(tuple => tuple[0]);
  expect(Array.from(map.keys())).toEqual(expectedNamesArray);

  const expectedHooksArray = expectedNamesTuples.map(tuple => tuple[1]);
  expect(Array.from(map.values()).map(v => v[0].init.callee.name)).toEqual(
    expectedHooksArray,
  );
}

describe('astUtils', () => {
  beforeEach(() => {});

  describe('getHookNamesFromAST', () => {
    it('should parse names for built-in hooks', () => {
      const code = `
import {useState, useContext, useMemo, useReducer} from 'react';

export function Component() {
  const a = useMemo(() => A);
  const [b, setB] = useState(0);

  // prettier-ignore
  const c = useContext(A), d = useContext(B); // eslint-disable-line one-var

  const [e, dispatch] = useReducer(reducer, initialState);
  const f = useRef(null)

  return a + b + c + d + e + f.current;
}`;

      const parsed = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'flow'],
      });
      const hookNames = getHookNamesFromAST(parsed);
      expectHookNamesToEqual(hookNames, [
        ['a', 'useMemo'],
        ['b', 'useState'],
        ['c', 'useContext'],
        ['d', 'useContext'],
        ['e', 'useReducer'],
        ['f', 'useRef'],
      ]);
    });

    it('should parse names for custom hooks', () => {
      const code = `
import useTheme from 'useTheme';
import useValue from 'useValue';

export function Component() {
  const theme = useTheme();
  const [val, setVal] = useValue();

  return theme;
}`;

      const parsed = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'flow'],
      });
      const hookNames = getHookNamesFromAST(parsed);
      expectHookNamesToEqual(hookNames, [
        ['theme', 'useTheme'],
        ['val', 'useValue'],
      ]);
    });

    it('should skip names for non-nameable hooks', () => {
      const code = `
import useTheme from 'useTheme';
import useValue from 'useValue';

export function Component() {
  const [val, setVal] = useState(0);

  useEffect(() => {
    // ...
  });

  useLayoutEffect(() => {
    // ...
  });

  return val;
}`;

      const parsed = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'flow'],
      });
      const hookNames = getHookNamesFromAST(parsed);
      expectHookNamesToEqual(hookNames, [['val', 'useState']]);
    });
  });
});
