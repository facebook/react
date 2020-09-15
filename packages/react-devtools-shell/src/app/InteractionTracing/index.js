/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useCallback, useEffect, useState} from 'react';
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {
  unstable_trace as trace,
  unstable_wrap as wrap,
} from 'scheduler/tracing';

export default function InteractionTracing() {
  const [count, setCount] = useState(0);
  const [shouldCascade, setShouldCascade] = useState(false);

  const handleUpdate = useCallback(() => {
    trace('count', performance.now(), () => {
      setTimeout(
        wrap(() => {
          setCount(count + 1);
        }),
        count * 100,
      );
    });
  }, [count]);

  const handleCascadingUpdate = useCallback(() => {
    trace('cascade', performance.now(), () => {
      setTimeout(
        wrap(() => {
          batchedUpdates(() => {
            setCount(count + 1);
            setShouldCascade(true);
          });
        }),
        count * 100,
      );
    });
  }, [count]);

  const handleMultiple = useCallback(() => {
    trace('first', performance.now(), () => {
      trace('second', performance.now(), () => {
        setTimeout(
          wrap(() => {
            setCount(count + 1);
          }),
          count * 100,
        );
      });
    });
  }, [count]);

  useEffect(() => {
    if (shouldCascade) {
      setTimeout(
        wrap(() => {
          setShouldCascade(false);
        }),
        count * 100,
      );
    }
  }, [count, shouldCascade]);

  return (
    <Fragment>
      <h1>Interaction Tracing</h1>
      <button onClick={handleUpdate}>Update ({count})</button>
      <button onClick={handleCascadingUpdate}>
        Cascading Update ({count}, {shouldCascade ? 'true' : 'false'})
      </button>
      <button onClick={handleMultiple}>Multiple</button>
    </Fragment>
  );
}
