// @flow

import React from 'react';
import styles from './HooksTree.css';

import type { InspectedHooks } from 'src/backend/types';

type Props = {|
  inspectedHooks: InspectedHooks | null,
|};

export default function HooksTree({ inspectedHooks }: Props) {
  if (inspectedHooks === null) {
    return null;
  }

  // TODO
  return (
    <div className={styles.HooksTree}>
      hooks
      <div className={styles.ComingSoon}>Coming soon...</div>
    </div>
  );
}
