// @flow

import React from 'react';
import styles from './ButtonIcon.css';

type Props = {|
  type:
    | 'back'
    | 'close'
    | 'down'
    | 'more'
    | 'search'
    | 'up'
    | 'view-dom'
    | 'view-source',
|};

export default function ButtonIcon({ type }: Props) {
  let pathData = null;
  switch (type) {
    case 'back':
      pathData = PATH_BACK;
      break;
    case 'close':
      pathData = PATH_CLOSE;
      break;
    case 'down':
      pathData = PATH_DOWN;
      break;
    case 'more':
      pathData = PATH_MORE;
      break;
    case 'search':
      pathData = PATH_SEARCH;
      break;
    case 'up':
      pathData = PATH_UP;
      break;
    case 'view-dom':
      pathData = PATH_VIEW_DOM;
      break;
    case 'view-source':
      pathData = PATH_VIEW_SOURCE;
      break;
    default:
      console.warn(`Unsupported type "${type}" specified for ButtonIcon`);
      break;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={styles.ButtonIcon}
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path fill="currentColor" d={pathData} />
    </svg>
  );
}

const PATH_BACK = `
  M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9
  2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41
  10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z
`;

const PATH_CLOSE =
  'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

const PATH_DOWN = 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z';

const PATH_MORE = `
  M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.97.89 1.66.89H22c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9
  13.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83
  0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5
  1.5.67 1.5 1.5-.67 1.5-1.5 1.5z
`;

const PATH_SEARCH = `
  M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46
  4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87
  0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z
`;

const PATH_UP = 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z';

const PATH_VIEW_DOM = `
  M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12
  17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3
  3-1.34 3-3-1.34-3-3-3z
`;

const PATH_VIEW_SOURCE = `
  M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z
  `;
