import React, {useContext} from 'react';
import {DataContext, RegistryContext} from './Contexts';

import styles from './ContextMenuItem.css';

type Props = {|
  children: React$Node,
  onClick: Object => void,
  title: string,
|};

export default function ContextMenuItem({children, onClick, title}: Props) {
  const data = useContext(DataContext);
  const {hideMenu} = useContext(RegistryContext);

  const handleClick = event => {
    onClick(data);
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
