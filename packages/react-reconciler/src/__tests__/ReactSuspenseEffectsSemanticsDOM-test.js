/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let TestUtils;

describe('ReactSuspenseEffectsSemanticsDOM', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
  });

  it('should not cause a cycle when combined with a render phase update', () => {
    let scheduleSuspendingUpdate;

    function App() {
      const [value, setValue] = React.useState(true);

      scheduleSuspendingUpdate = () => setValue(!value);

      return (
        <>
          <React.Suspense fallback="Loading...">
            <ComponentThatCausesBug value={value} />
            <ComponentThatSuspendsOnUpdate shouldSuspend={!value} />
          </React.Suspense>
        </>
      );
    }

    function ComponentThatCausesBug({value}) {
      const [mirroredValue, setMirroredValue] = React.useState(value);
      if (mirroredValue !== value) {
        setMirroredValue(value);
      }

      // eslint-disable-next-line no-unused-vars
      const [_, setRef] = React.useState(null);

      return <div ref={setRef} />;
    }

    const promise = Promise.resolve();

    function ComponentThatSuspendsOnUpdate({shouldSuspend}) {
      if (shouldSuspend) {
        // Fake Suspend
        throw promise;
      }
      return null;
    }

    TestUtils.act(() => {
      const root = ReactDOM.createRoot(document.createElement('div'));
      root.render(<App />);
    });

    TestUtils.act(() => {
      scheduleSuspendingUpdate();
    });
  });
});
