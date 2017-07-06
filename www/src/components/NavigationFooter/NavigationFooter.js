import cn from 'classnames';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './NavigationFooter.module.scss';

const linkToTitle = link => link.replace(/-/g, ' ').replace('.html', '');

const NavigationFooter = ({next, prev}) => (
  <div className={styles.NavigationFooter}>
    <ul className={styles.List}>
      <li className={styles.ListItem}>
        {prev &&
          <div>
            <div className={styles.SecondaryLabel}>Previous article</div>
            <Link
              className={styles.PrimaryLabel}
              to={prev}>
              {linkToTitle(prev)}
            </Link>
          </div>}
      </li>
      {next &&
        <li className={cn(styles.ListItem, styles.ListItemNext)}>
          <div>
            <div className={styles.SecondaryLabel}>Next article</div>
            <Link
              className={styles.PrimaryLabel}
              to={next}>
              {linkToTitle(next)}
            </Link>
          </div>
        </li>}
    </ul>
  </div>
);

NavigationFooter.propTypes = {
  next: PropTypes.string,
  prev: PropTypes.string,
};

export default NavigationFooter;
