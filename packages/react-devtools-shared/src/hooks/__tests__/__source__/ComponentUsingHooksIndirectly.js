/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useEffect, useState} from 'react';

export function Component() {
  const countState = useState(0);
  const count = countState[0];
  const setCount = countState[1];

  const darkMode = useIsDarkMode();
  const [isDarkMode] = darkMode;

  useEffect(() => {
    // ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return (
    <>
      <div>Dark mode? {isDarkMode}</div>
      <div>Count: {count}</div>
      <button onClick={handleClick}>Update count</button>
    </>
  );
}

function useIsDarkMode() {
  const darkModeState = useState(false);
  const [isDarkMode] = darkModeState;

  useEffect(function useEffectCreate() {
    // Here is where we may listen to a "theme" event...
  }, []);

  return [isDarkMode, () => {}];
}
