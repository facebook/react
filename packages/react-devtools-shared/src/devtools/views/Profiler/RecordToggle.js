/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import {ProfilerContext} from './ProfilerContext';
import {StoreContext} from '../context';

import styles from './RecordToggle.css';

type Props = {};

export default function RecordToggle(_: Props): React.Node {
  const {isProfiling, startProfiling, stopProfiling} = useContext(
    ProfilerContext,
  );

  const {supportsProfiling} = useContext(StoreContext);

  let className = styles.InactiveRecordToggle;
  if (!supportsProfiling) {
    className = styles.DisabledRecordToggle;
  } else if (isProfiling) {
    className = styles.ActiveRecordToggle;
  }

  return (
    <Button
      className={className}
      disabled={!supportsProfiling}
      onClick={isProfiling ? stopProfiling : startProfiling}
      testName="ProfilerToggleButton"
      title={isProfiling ? 'Stop profiling' : 'Start profiling'}>
      <ButtonIcon type="record" />
    </Button>
  );
}
