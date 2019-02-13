// @flow

import React from 'react';

import styles from './ReactLogo.css';

export default function ReactLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={styles.ReactLogo}
      viewBox="-11.5 -10.23174 23 20.46348"
    >
      <circle cx="0" cy="0" r="2.05" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}
