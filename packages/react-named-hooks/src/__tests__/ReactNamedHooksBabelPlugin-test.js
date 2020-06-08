/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const babel = require('@babel/core');
const {wrap} = require('jest-snapshot-serializer-raw');
const namedHooks = require('react-named-hooks');

function transform(input, options = {}) {
  return wrap(
    babel.transform(input, {
      babelrc: false,
      configFile: false,
      plugins: [
        '@babel/syntax-jsx',
        [
          namedHooks,
          {
            skipEnvCheck: true,
            // To simplify debugging tests:
            emitFullSignatures: true,
            ...options.freshOptions,
          },
        ],
        ...(options.plugins || []),
      ],
    }).code,
  );
}

describe('ReactNamedHooksBabelPlugin', () => {
  it('injects first array item for useState, useReducer', () => {
    expect(
      transform(`
        function Foo() {
          const [count, setCount] = useState(0);

          const [data, dispatch] = useReducer(reducer, initialData);
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });

  it('do not injects when lowercased first array item is a default hook name for useState, useReducer', () => {
    expect(
      transform(`
        function Foo() {
          const [State, setCount] = useState(0);

          const [reduceR, dispatch] = useReducer(reducer, initialData);
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });

  it('inejcts identifier for useRef, useCallback, useMemo', () => {
    expect(
      transform(`
        function Foo() {
          const spanRef = useRef(null);

          const memoizedSetClick = useCallback(() => setCount(count + 1), [count]);

          const memoizedCountMultiplied = useMemo(() => count * 2, [count]);
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });

  it('do not injects when lowercased identifier is a default hook name for useRef, useCallback, useMemo', () => {
    expect(
      transform(`
        function Foo() {
          const Ref = useRef(null);

          const CallBack = useCallback(() => setCount(count + 1), [count]);

          const memo = useMemo(() => count * 2, [count]);
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });

  it('inejcts first argument for useContext', () => {
    expect(
      transform(`
        function Foo() {
          const ctxValue = useContext(StringContext);
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });

  it('do not injects when lowercased first argument is a default hook name for useContext', () => {
    expect(
      transform(`
        function Foo() {
          const ctxValue = useContext(Context);
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });

  it('injects for default hooks within nested custom hook', () => {
    expect(
      transform(`
        function useNestedInnerHook() {
          const [nestedState] = useState(123);
          return nestedState;
        }
        function useNestedOuterHook() {
          return useNestedInnerHook();
        }
        function Foo() {
          useNestedOuterHook();
          return <div></div>;
        }
    `),
    ).toMatchSnapshot();
  });
});
