/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useCallback, useContext} from 'react';
import {ProfilerContext} from './ProfilerContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import {StoreContext} from '../context';

export default function ClearProfilingDataButton() {
  const store = useContext(StoreContext);
  const {didRecordCommits, isProfiling} = useContext(ProfilerContext);
  const {profilerStore} = store;

  const clear = useCallback(() => profilerStore.clear(), [profilerStore]);

  return (
    <Button
      disabled={isProfiling || !didRecordCommits}
      onClick={clear}
      title="Clear profiling data">
      <ButtonIcon type="clear" />
    </Button>
  );
}
