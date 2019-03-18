// @flow

import React, { useContext } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { ProfilerContext } from './ProfilerContext';

import styles from './RecordToggle.css';

export type Props = {|
  disabled?: boolean,
|};

export default function RecordToggle({ disabled }: Props) {
  const { isProfiling, startProfiling, stopProfiling } = useContext(
    ProfilerContext
  );

  return (
    <Button
      className={
        isProfiling ? styles.ActiveRecordToggle : styles.InactiveRecordToggle
      }
      disabled={disabled}
      onClick={isProfiling ? stopProfiling : startProfiling}
      title={isProfiling ? 'Stop profiling' : 'Start profiling'}
    >
      <ButtonIcon type="record" />
    </Button>
  );
}
