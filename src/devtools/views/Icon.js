// @flow

import React from 'react';
import styles from './Icon.css';

type Props = {|
  className?: string,
  type: 'arrow' | 'search',
|};

export default function Icon({ className = '', type }: Props) {
  let pathData = null;
  switch (type) {
    case 'arrow':
      pathData = PATH_ARROW;
      break;
    case 'search':
      pathData = PATH_SEARCH;
      break;
    default:
      console.warn(`Unsupported type "${type}" specified for Icon`);
      break;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.Icon} ${className}`}
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
const PATH_SEARCH = `
  M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91
  16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99
  5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z
`;
