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
import {TimelineContext} from 'react-devtools-timeline/src/TimelineContext';

export default function ClearProfilingDataButton() {
  const store = useContext(StoreContext);
  const {didRecordCommits, isProfiling, selectedTabID} = useContext(
    ProfilerContext,
  );
  const {file, setFile} = useContext(TimelineContext);
  const {profilerStore} = store;

  let doesHaveData = false;
  if (selectedTabID === 'timeline') {
    doesHaveData = file !== null;
  } else {
    doesHaveData = didRecordCommits;
  }

  const clear = () => {
    if (selectedTabID === 'timeline') {
      setFile(null);
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
