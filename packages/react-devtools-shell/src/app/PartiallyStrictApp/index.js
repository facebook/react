/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {StrictMode} from 'react';

export default function PartiallyStrictApp(): React.Node {
  return (
    <>
      <Child />
      <StrictMode>
        <StrictChild />
      </StrictMode>
    </>
  );
}

function Child() {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    console.log(__REACT_DEVTOOLS_GLOBAL_HOOK__);

    console.log('Normal button clicked (NOT in StrictMode) - should log once');
    console.warn('Normal warning - should appear once');
    setCount(c => c + 1);
  };

  return (
    <div style={{padding: '20px', border: '2px solid green', margin: '10px'}}>
      <h2>Normal Component (NOT in StrictMode)</h2>
      <button onClick={handleClick} style={{padding: '10px', fontSize: '16px'}}>
        Click me! (count: {count})
      </button>
      <p>Logs should appear ONCE when you click</p>
    </div>
  );
}

function StrictChild() {
  const [count, setCount] = React.useState(0);
  
  // RENDER LOGS - These run during render and WILL be double-invoked
  console.log('[RENDER] StrictChild rendering - should log TWICE');
  console.warn('[RENDER] Warning during render - should appear TWICE');
  
  // This effect should run twice in StrictMode (mount, unmount, remount)
  React.useEffect(() => {
    console.log('[useEffect] Strict component mounted - should log TWICE');
    return () => {
      console.log('[useEffect cleanup] Unmounting - should log ONCE (during double-invoke)');
    };
  }, []);
  
  const handleClick = () => {
    console.log('[onClick] Button clicked - logs ONCE (event handlers are NOT double-invoked)');
    setCount(c => c + 1);
  };

  return (
    <div style={{padding: '20px', border: '2px solid red', margin: '10px'}}>
      <h2>Strict Component (IN StrictMode)</h2>
      <button onClick={handleClick} style={{padding: '10px', fontSize: '16px'}}>
        Click me to trigger re-render! (count: {count})
      </button>
      <p style={{fontSize: '14px'}}>
        Watch console on mount and when you click (triggers re-render)
      </p>
      <p style={{fontSize: '12px', color: '#666'}}>
        Render logs appear TWICE (second dimmed by default).<br/>
        Event handler logs appear ONCE (not affected by StrictMode).
      </p>
    </div>
  );
}

function Grandchild({label}: {label: string}) {
  return <div style={{padding: '20px', border: '2px solid blue', margin: '10px'}}>
    <h2>Grandchild ({label})</h2>
    <p>Check your console to see the logs!</p>
  </div>;
}
