import PropTypes from 'prop-types';
import React from 'react';
import styles from './MarkdownHeader.module.scss';

const MarkdownHeader = ({path, title}) => (
  <header className={styles.MarkdownHeader}>
    <h1 className={styles.Title}>
      {title}
    </h1>
    {path &&
      <a
        className={styles.EditLink}
        href={`https://github.com/facebook/react/tree/master/docs/${path}`}>
        Edit this page
      </a>}
  </header>
);

MarkdownHeader.propTypes = {
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default MarkdownHeader;
