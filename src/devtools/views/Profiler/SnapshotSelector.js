// @flow

import React from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

import styles from './SnapshotSelector.css';

export type Props = {||};

export default function SnapshotSelector(_: Props) {
  return (
    <div className={styles.SnapshotSelector}>
      1 / 3
      <Button className={styles.Button}>
        <ButtonIcon type="previous" />
      </Button>
      <div className={styles.Commits}>
        [] {/* TODO (profiling) Add FixedSizeList selector */}
      </div>
      <Button className={styles.Button}>
        <ButtonIcon type="next" />
      </Button>
    </div>
  );
}
