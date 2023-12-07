/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {RegistryContext} from './Contexts';

import styles from './ContextMenuItem.css';

import type {RegistryContextType} from './Contexts';

type Props = {
  children: React$Node,
  onClick: () => void,
  title: string,
};

export default function ContextMenuItem({
  children,
  onClick,
  title,
}: Props): React.Node {
  const {hideMenu} = useContext<RegistryContextType>(RegistryContext);

  const handleClick = (event: any) => {
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
