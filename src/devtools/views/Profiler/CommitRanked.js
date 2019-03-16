// @flow

import React, { useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { StoreContext } from '../context';

import styles from './CommitRanked.css';

export default function CommitRanked(_: {||}) {
  const { rendererID, rootID, selectedCommitIndex } = useContext(
    ProfilerContext
  );

  const { profilingCache } = useContext(StoreContext);

  const profilingSummary = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const commitDetails = profilingCache.CommitDetails.read({
    commitIndex: ((selectedCommitIndex: any): number),
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const commitTree = profilingCache.CommitTree.read({
    commitIndex: ((selectedCommitIndex: any): number),
    profilingSummary,
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  return 'Coming soon: Ranked';
}
