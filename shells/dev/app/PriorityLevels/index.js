// @flow

import React, { Fragment, useCallback, useState } from 'react';
import { unstable_next as next } from 'scheduler';

export default function PriorityLevels() {
  const [count, setCount] = useState(0);

  const startSequence = useCallback(() => {
    setCount(1);
    next(() => setCount(2));
  }, []);

  return (
    <Fragment>
      <h1>Priority Levels</h1>
      <button onClick={startSequence}>start sequence</button>
      {count >= 1 && <Text>One</Text>}
      {count >= 2 && <Text>Two</Text>}
      {count >= 2 && (
        <div hidden>
          <Text>Three</Text>
        </div>
      )}
    </Fragment>
  );
}

const Text = ({ children }) => children;
