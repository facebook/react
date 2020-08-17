// @flow

import type {RegistryContextType} from './Contexts';

import * as React from 'react';
import {useContext} from 'react';
import {RegistryContext} from './Contexts';

import styles from './ContextMenuItem.css';

type Props = {|
  children: React$Node,
  onClick: () => void,
  title: string,
|};

export default function ContextMenuItem({children, onClick, title}: Props) {
  const {hideMenu} = useContext<RegistryContextType>(RegistryContext);

  const handleClick: MouseEventHandler = event => {
    onClick();
    hideMenu();
  };

  return (
    <div
      className={styles.ContextMenuItem}
      onClick={handleClick}
      onTouchEnd={handleClick}>
      {children}
    </div>
  );
}
