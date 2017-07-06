import cn from 'classnames';
import Link from 'gatsby-link';
import React from 'react';
import styles from './Section.module.scss';
import slugify from '../../utils/slugify';

// TODO Account for redirect_from URLs somehow; they currently won't match.
const isItemActive = (item, pathname) => pathname.includes(slugify(item.id));

// TODO Support external links (eg Community > Complementary Tools, Community > Examples)

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
            {item.href &&
              <a
                className={cn(styles.Link, styles.ExternalLink)}
                href={item.href}>
                {item.title}
                {/*
                <svg style={{height: 12, width: 12}} viewBox="0 0 24 24">
                  <path fill="#000000" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                </svg>
                */}
              </a>}
            {!item.href &&
              <Link
                className={cn(styles.Link, {
                  [styles.ActiveLink]: isItemActive(item, pathname),
                })}
                to={slugify(item.id)}>
                {item.title}
              </Link>}
          </li>
        ))}
      </ul>}
  </div>
);

export default Section;
