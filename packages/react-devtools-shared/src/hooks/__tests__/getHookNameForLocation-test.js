/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse} from '@babel/parser';
import {generateHookMap} from '../generateHookMap';
import {getHookNameForLocation} from '../getHookNameForLocation';

function expectHookMapToEqual(actual, expected) {
  expect(actual.names).toEqual(expected.names);

  const formattedMappings = [];
  actual.mappings.forEach(lines => {
    lines.forEach(segment => {
      const name = actual.names[segment[2]];
      if (name == null) {
        throw new Error(`Expected to find name at position ${segment[2]}`);
      }
      formattedMappings.push(`${name} from ${segment[0]}:${segment[1]}`);
    });
  });
  expect(formattedMappings).toEqual(expected.mappings);
}

describe('generateHookMap', () => {
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
    const hookMap = generateHookMap(parsed);
    expectHookMapToEqual(hookMap, {
      names: ['<no-hook>', 'a', 'b', 'c', 'd', 'e', 'f'],
      mappings: [
        '<no-hook> from 1:0',
        'a from 5:12',
        '<no-hook> from 5:28',
        'b from 6:20',
        '<no-hook> from 6:31',
        'c from 9:12',
        '<no-hook> from 9:25',
        'd from 9:31',
        '<no-hook> from 9:44',
        'e from 11:24',
        '<no-hook> from 11:57',
        'f from 12:12',
        '<no-hook> from 12:24',
      ],
    });

    expect(getHookNameForLocation({line: 1, column: 0}, hookMap)).toEqual(null);
    expect(getHookNameForLocation({line: 2, column: 25}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 5, column: 12}, hookMap)).toEqual('a');
    expect(getHookNameForLocation({line: 5, column: 13}, hookMap)).toEqual('a');
    expect(getHookNameForLocation({line: 5, column: 28}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 5, column: 29}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 6, column: 20}, hookMap)).toEqual('b');
    expect(getHookNameForLocation({line: 6, column: 30}, hookMap)).toEqual('b');
    expect(getHookNameForLocation({line: 6, column: 31}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 7, column: 31}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 8, column: 20}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 9, column: 12}, hookMap)).toEqual('c');
    expect(getHookNameForLocation({line: 9, column: 13}, hookMap)).toEqual('c');
    expect(getHookNameForLocation({line: 9, column: 25}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 9, column: 26}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 9, column: 31}, hookMap)).toEqual('d');
    expect(getHookNameForLocation({line: 9, column: 32}, hookMap)).toEqual('d');
    expect(getHookNameForLocation({line: 9, column: 44}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 9, column: 45}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 11, column: 24}, hookMap)).toEqual(
      'e',
    );
    expect(getHookNameForLocation({line: 11, column: 56}, hookMap)).toEqual(
      'e',
    );
    expect(getHookNameForLocation({line: 11, column: 57}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 11, column: 58}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 12, column: 12}, hookMap)).toEqual(
      'f',
    );
    expect(getHookNameForLocation({line: 12, column: 23}, hookMap)).toEqual(
      'f',
    );
    expect(getHookNameForLocation({line: 12, column: 24}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 100, column: 50}, hookMap)).toEqual(
      null,
    );
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
    const hookMap = generateHookMap(parsed);
    expectHookMapToEqual(hookMap, {
      names: ['<no-hook>', 'theme', 'val'],
      mappings: [
        '<no-hook> from 1:0',
        'theme from 6:16',
        '<no-hook> from 6:26',
        'val from 7:24',
        '<no-hook> from 7:34',
      ],
    });

    expect(getHookNameForLocation({line: 1, column: 0}, hookMap)).toEqual(null);
    expect(getHookNameForLocation({line: 6, column: 16}, hookMap)).toEqual(
      'theme',
    );
    expect(getHookNameForLocation({line: 6, column: 26}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 7, column: 24}, hookMap)).toEqual(
      'val',
    );
    expect(getHookNameForLocation({line: 7, column: 34}, hookMap)).toEqual(
      null,
    );
  });

  it('should parse names for nested hook calls', () => {
    const code = `
import {useMemo, useState} from 'react';

export function Component() {
  const InnerComponent = useMemo(() => () => {
    const [state, setState] = useState(0);

    return state;
  });

  return null;
}`;

    const parsed = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'flow'],
    });
    const hookMap = generateHookMap(parsed);
    expectHookMapToEqual(hookMap, {
      names: ['<no-hook>', 'InnerComponent', 'state'],
      mappings: [
        '<no-hook> from 1:0',
        'InnerComponent from 5:25',
        'state from 6:30',
        'InnerComponent from 6:41',
        '<no-hook> from 9:4',
      ],
    });

    expect(getHookNameForLocation({line: 1, column: 0}, hookMap)).toEqual(null);
    expect(getHookNameForLocation({line: 5, column: 25}, hookMap)).toEqual(
      'InnerComponent',
    );
    expect(getHookNameForLocation({line: 6, column: 30}, hookMap)).toEqual(
      'state',
    );
    expect(getHookNameForLocation({line: 6, column: 40}, hookMap)).toEqual(
      'state',
    );
    expect(getHookNameForLocation({line: 6, column: 41}, hookMap)).toEqual(
      'InnerComponent',
    );
    expect(getHookNameForLocation({line: 9, column: 4}, hookMap)).toEqual(null);
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
    const hookMap = generateHookMap(parsed);
    expectHookMapToEqual(hookMap, {
      names: ['<no-hook>', 'val'],
      mappings: ['<no-hook> from 1:0', 'val from 6:24', '<no-hook> from 6:35'],
    });

    expect(getHookNameForLocation({line: 1, column: 0}, hookMap)).toEqual(null);
    expect(getHookNameForLocation({line: 6, column: 24}, hookMap)).toEqual(
      'val',
    );
    expect(getHookNameForLocation({line: 6, column: 35}, hookMap)).toEqual(
      null,
    );
    expect(getHookNameForLocation({line: 8, column: 2}, hookMap)).toEqual(null);
  });
});
