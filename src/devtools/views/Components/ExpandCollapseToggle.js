// @flow

import React, { useCallback } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

import styles from './ExpandCollapseToggle.css';

type ExpandCollapseToggleProps = {|
  isOpen: boolean,
  setIsOpen: Function,
|};

export default function ExpandCollapseToggle({
  isOpen,
  setIsOpen,
}: ExpandCollapseToggleProps) {
  const handleClick = useCallback(() => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  }, [setIsOpen]);

  return (
    <Button
      className={styles.ExpandCollapseToggle}
      onClick={handleClick}
      title={`${isOpen ? 'Collapse' : 'Expand'} prop value`}
    >
      <ButtonIcon type={isOpen ? 'expanded' : 'collapsed'} />
    </Button>
  );
}
