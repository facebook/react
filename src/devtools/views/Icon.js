// @flow

import React from 'react';
import styles from './Icon.css';

type Props = {|
  type: 'arrow',
|};

export default function Icon({ type }: Props) {
  let pathData = null;
  switch (type) {
    case 'arrow':
      pathData = PATH_ARROW;
      break;
    default:
      console.warn(`Unsupported type "${type}" specified for Icon`);
      break;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={styles.Icon}
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="currentColor" d={pathData} />
    </svg>
  );
}

const PATH_ARROW = 'M8 5v14l11-7z';
