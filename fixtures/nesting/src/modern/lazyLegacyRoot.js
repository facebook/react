import React from 'react';
import {useContext, useMemo, useRef, useState, useLayoutEffect} from 'react';

import {__RouterContext} from 'react-router';
import ThemeContext from './shared/ThemeContext';

let rendererModule = {
  status: 'pending',
  promise: null,
  result: null,
};

export default function lazyLegacyRoot(getLegacyComponent) {
  let componentModule = {
    status: 'pending',
    promise: null,
    result: null,
  };

  return function Wrapper(props) {
    const createLegacyRoot = readRecord(rendererModule, () =>
      import('../legacy/createLegacyRoot')
    ).default;
    const Component = readRecord(componentModule, getLegacyComponent).default;
    const containerRef = useRef(null);
    const [root, setRoot] = useState(null);

    // Populate every contexts we want the legacy subtree to see.
    // Then in src/legacy/createLegacyRoot we will apply them.
    const theme = useContext(ThemeContext);
    const router = useContext(__RouterContext);
    const context = useMemo(
      () => ({
        theme,
        router,
      }),
      [theme, router]
    );

    // Create/unmount.
    useLayoutEffect(() => {
      if (!root) {
        let r = createLegacyRoot(containerRef.current);
        setRoot(r);
        return () => r.unmount();
      }
    }, [createLegacyRoot, root]);

    // Mount/update.
    useLayoutEffect(() => {
      if (root) {
        root.render(Component, props, context);
      }
    }, [Component, root, props, context]);

    return <div style={{display: 'contents'}} ref={containerRef} />;
  };
}

// This is similar to React.lazy, but implemented manually.
// We use this to Suspend rendering of this component until
// we fetch the component and the legacy React to render it.
function readRecord(record, createPromise) {
  if (record.status === 'fulfilled') {
    return record.result;
  }
  if (record.status === 'rejected') {
    throw record.result;
  }
  if (!record.promise) {
    record.promise = createPromise().then(
      value => {
        if (record.status === 'pending') {
          record.status = 'fulfilled';
          record.promise = null;
          record.result = value;
        }
      },
      error => {
        if (record.status === 'pending') {
          record.status = 'rejected';
          record.promise = null;
          record.result = error;
        }
      }
    );
  }
  throw record.promise;
}
