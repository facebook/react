import React from 'react';
import styles from './MarkdownHeader.module.scss';

const MarkdownHeader = ({path, title}) => (
  <header className={styles.MarkdownHeader}>
    <h1 className={styles.Title}>
      {title}
    </h1>
    <a
      className={styles.EditLink}
      href={`https://github.com/facebook/react/tree/master/docs/${path}`}>
      Edit this page
    </a>
  </header>
);

export default MarkdownHeader;
