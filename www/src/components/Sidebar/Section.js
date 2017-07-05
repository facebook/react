import cn from 'classnames';
import Link from 'gatsby-link';
import React from 'react';
import styles from './Section.module.scss';
import slugify from '../../utils/slugify';

// TODO Account for redirect_from URLs somehow; they currently won't match.
const isItemActive = (item, pathname) => pathname.includes(slugify(item.id));

const Section = ({isActive, onClick, pathname, section}) => (
  <div className={styles.Section}>
    <h2 className={styles.Header}>
      <a
        className={cn(styles.HeaderLink, {
          [styles.ActiveHeaderLink]: isActive,
        })}
        onClick={onClick}>
        {section.title}
      </a>
    </h2>
    {isActive &&
      <ul className={styles.List}>
        {section.items.map(item => (
          <li key={item.id}>
            <Link
              className={cn(styles.Link, {
                [styles.ActiveLink]: isItemActive(item, pathname),
              })}
              to={slugify(item.id)}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>}
  </div>
);

export default Section;
