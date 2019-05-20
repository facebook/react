// @flow

import React, { Fragment, useCallback, useState } from 'react';
import {
  unstable_IdlePriority as IdlePriority,
  unstable_LowPriority as LowPriority,
  unstable_runWithPriority as runWithPriority,
} from 'scheduler';

export default function PriorityLevels() {
  const [defaultPriority, setDefaultPriority] = useState<boolean>(false);
  const [idlePriority, setIdlePriority] = useState<boolean>(false);
  const [normalPriority, setLowPriority] = useState<boolean>(false);

  const resetSequence = useCallback(() => {
    setDefaultPriority(false);
    setLowPriority(false);
    setIdlePriority(false);
  }, []);

  const startSequence = useCallback(() => {
    setDefaultPriority(true);
    runWithPriority(LowPriority, () => setLowPriority(true));
    runWithPriority(IdlePriority, () => setIdlePriority(true));
  }, []);

  const labels = [];
  if (defaultPriority) {
    labels.push('(default priority)');
  }
  if (normalPriority) {
    labels.push('Low Priority');
  }
  if (idlePriority) {
    labels.push('Idle Priority');
  }

  return (
    <Fragment>
      <h1>Priority Levels</h1>
      <button onClick={resetSequence}>Reset</button>
      <button onClick={startSequence}>Start sequence</button>
      <span>{labels.join(', ')}</span>
    </Fragment>
  );
}
