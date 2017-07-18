import cn from 'classnames';
import Container from '../../../components/Container';
import Link from 'gatsby-link';
import React from 'react';
import styles from './Header.module.scss';

import logoSvg from '../../../icons/logo.svg';
import searchSvg from '../../../icons/search.svg';

// Note this version may point to an alpha/beta/next release.
// This is how the previous Jekyll site determined version though.
const {version} = require('../../../../../package.json')

const Header = () => (
  <header className={styles.header}>
    <Container>
      <div className={styles.row}>
        <a className={styles.logoContainer} href="/">
          <img src={logoSvg} alt="React" height="20" />
          <span className={styles.logoTitle}>React</span>
        </a>


        <nav className={styles.nav}>
          <Link
            to="/docs/hello-world.html"
            className={cn('nav__link', {
              'is-current': location.pathname.includes('/docs/'),
            })}
          >
            Docs
          </Link>
          <Link
            to="/tutorial/tutorial.html"
            className={cn('nav__link', {
              'is-current': location.pathname.includes('/tutorial/'),
            })}
          >
            Tutorial
          </Link>
          <Link
            to="/community/support.html"
            className={cn('nav__link', {
              'is-current': location.pathname.includes('/community/'),
            })}
          >
            Community
          </Link>
          <Link
            to="/blog.html"
            className={cn('nav__link', {
              'is-current': location.pathname.includes('/blog'),
            })}
          >
            Blog
          </Link>
        </nav>

        <form className={styles.searchForm}>
          <label htmlFor="search">
            <img src={searchSvg} alt="Search" height="16" />
          </label>
          <div className={styles.searchInputContainer}>
            <input
              id="algolia-doc-search"
              className={styles.searchInput}
              type="search"
              placeholder="Search docs"
            />
          </div>
        </form>

        <div className={styles.floatingContent}>
          <a
            className={styles.versionLink}
            href="https://github.com/facebook/react/releases"
          >
            v{version}
          </a>
          <a
            className={styles.githubLink}
            href="#"
          >
            GitHub
          </a>
        </div>
      </div>
    </Container>
  </header>
);

export default Header;