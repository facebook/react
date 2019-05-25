// @flow

import React, { useCallback, useContext } from 'react';
import { CommitFilterModalContext } from './CommitFilterModalContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

export default function ToggleCommitFilterModalButton() {
  const { setIsModalShowing } = useContext(CommitFilterModalContext);

  const showFilterModal = useCallback(() => setIsModalShowing(true), [
    setIsModalShowing,
  ]);

  return (
    <Button onClick={showFilterModal} title="Filter commits by duration">
      <ButtonIcon type="filter" />
    </Button>
  );
}
