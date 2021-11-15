/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useDebugValue, useEffect, useState} from 'react';

export function Component() {
  const [count, setCount] = useState(0);
  const isDarkMode = useIsDarkMode();
  const {foo} = useFoo();

  useEffect(() => {
    // ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return (
    <>
      <div>Dark mode? {isDarkMode}</div>
      <div>Count: {count}</div>
      <div>Foo: {foo}</div>
      <button onClick={handleClick}>Update count</button>
    </>
  );
}

function useIsDarkMode() {
  const [isDarkMode] = useState(false);

  useEffect(function useEffectCreate() {
    // Here is where we may listen to a "theme" event...
  }, []);

  return isDarkMode;
}

function useFoo() {
  useDebugValue('foo');
  return {foo: true};
}
