import React from 'react';
import styles from './Container.module.scss';

/**
 * This component wraps page content sections (eg header, footer, main).
 * It provides consistent margin and max width behavior.
 */
const Container = ({children}) => (
  <div className={styles.Container}>
    {children}
  </div>
);

export default Container;
