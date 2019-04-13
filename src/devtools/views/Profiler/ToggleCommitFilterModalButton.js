// @flow

import React, { useCallback, useContext } from 'react';
import { CommitFilterModalContext } from './CommitFilterModalContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

export default function ToggleCommitFilterModalButton() {
  const { setIsFilterModalShowing } = useContext(CommitFilterModalContext);

  const showFilterModal = useCallback(() => setIsFilterModalShowing(true), [
    setIsFilterModalShowing,
  ]);

  return (
    <Button onClick={showFilterModal} title="Filter commits by duration">
      <ButtonIcon type="filter" />
    </Button>
  );
}
