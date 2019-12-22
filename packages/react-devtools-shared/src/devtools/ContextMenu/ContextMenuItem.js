import React, {useContext} from 'react';
import {RegistryContext} from './Contexts';

import styles from './ContextMenuItem.css';

type Props = {|
  children: React$Node,
  onClick: Object => void,
  title: string,
|};

export default function ContextMenuItem({children, onClick, title}: Props) {
  const {hideMenu} = useContext(RegistryContext);

  const handleClick = event => {
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
