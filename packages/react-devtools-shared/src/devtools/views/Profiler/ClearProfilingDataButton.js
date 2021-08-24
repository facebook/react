/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {ProfilerContext} from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import {StoreContext} from '../context';
import {SchedulingProfilerContext} from 'react-devtools-scheduling-profiler/src/SchedulingProfilerContext';

export default function ClearProfilingDataButton() {
  const store = useContext(StoreContext);
  const {didRecordCommits, isProfiling, selectedTabID} = useContext(
    ProfilerContext,
  );
  const {clearSchedulingProfilerData, schedulingProfilerData} = useContext(
    SchedulingProfilerContext,
  );
  const {profilerStore} = store;

  let doesHaveData = false;
  if (selectedTabID === 'scheduling-profiler') {
    doesHaveData = schedulingProfilerData !== null;
  } else {
    doesHaveData = didRecordCommits;
  }

  const clear = () => {
    if (selectedTabID === 'scheduling-profiler') {
      clearSchedulingProfilerData();
    } else {
      profilerStore.clear();
    }
  };

  return (
    <Button
      disabled={isProfiling || !doesHaveData}
      onClick={clear}
      title="Clear profiling data">
      <ButtonIcon type="clear" />
    </Button>
  );
}
