import cn from 'classnames';
import Link from 'gatsby-link';
import React from 'react';
import styles from './Section.module.scss';
import slugify from '../../utils/slugify';

const Section = ({isActive, onClick, pathname, section}) => (
  <div className={styles.Section}>
    <h2
      className={cn(styles.Header, {
        [styles.ActiveHeader]: isActive,
      })}>
      <a onClick={onClick}>
        {section.title}
      </a>
    </h2>
    {isActive &&
      <ul className={styles.List}>
        {section.items.map(item => (
          <li
            className={cn(styles.ListItem, {
              [styles.ActiveListItem]: pathname.includes(slugify(item.id)),
            })}
            key={item.id}>
            <Link className={styles.Link} to={slugify(item.id)}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>}
  </div>
);

export default Section;
