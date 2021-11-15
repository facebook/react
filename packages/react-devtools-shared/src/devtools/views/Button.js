/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import styles from './Button.css';
import Tooltip from './Components/reach-ui/tooltip';

type Props = {
  children: React$Node,
  className?: string,
  title: React$Node,
  ...
};

export default function Button({
  children,
  className = '',
  title,
  ...rest
}: Props) {
  let button = (
    <button className={`${styles.Button} ${className}`} {...rest}>
      <span className={`${styles.ButtonContent} ${className}`} tabIndex={-1}>
        {children}
      </span>
    </button>
  );

  if (title) {
    button = <Tooltip label={title}>{button}</Tooltip>;
  }

  return button;
}
