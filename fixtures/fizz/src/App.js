/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Suspense } from 'react';
import Html from './Html';

const suspensePromises = {};
function ComponentThatSuspends({timeoutMs, text}) {
  if (!(text in suspensePromises)) {
    suspensePromises[text] = {suspensePromiseResolved: false};
  }
  if (!suspensePromises[text].suspensePromiseResolved) {
    if (!suspensePromises[text].suspensePromise) {
      suspensePromises[text].suspensePromise = new Promise((resolve) => {
        setTimeout(() => {
          suspensePromises[text].suspensePromiseResolved = true;
          suspensePromises[text].suspensePromise = null;
          resolve();
        }, timeoutMs);
      });
    }
    throw suspensePromises[text].suspensePromise;
  }
  return <div>Resolved {text}</div>;
}

function FallbackWithSuspends({text}) {
  return <div>
    This is a suspense fallback that has nested suspends
    <Suspense fallback={<div>Nested suspense fallback</div>}>
      <ComponentThatSuspends text={text} timeoutMs={5000}/>
    </Suspense>
  </div>;
}

function App({assets, title}) {
  return (
    <Html assets={assets} title={title}>
      <h1>React SSR Bug Repro</h1>
      <Suspense fallback={<FallbackWithSuspends text='Fallback' />}>
        <ComponentThatSuspends text="Text" timeoutMs={2000}/>
      </Suspense>
    </Html>
  );
}

export default App;