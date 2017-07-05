import cn from 'classnames';
import Link from 'gatsby-link';
import React from 'react';
import styles from './ButtonLink.module.scss';

const ButtonLink = ({children, type, ...rest}) => (
  <Link
    {...rest}
    className={cn({
      [styles.Primary]: type === 'primary',
      [styles.Secondary]: type === 'secondary',
    })}
  >
    <span className={styles.Inner}>
      {children}
    </span>
  </Link>
);

export default ButtonLink;
