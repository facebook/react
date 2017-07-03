import React from 'react';
import Link from 'gatsby-link';

import arrowSvg from '../icons/arrow.svg';
import logoSvg from '../icons/logo.svg';
import ossLogoPng from '../images/oss_logo.png';
import searchSvg from '../icons/search.svg';

import '../css/main.scss';

const Template = ({children}) => (
  <div className="site">
    <header className="header" id="header">
      <div className="wrapper">
        <div className="header__inner">
          <div className="header__logo">
            <a href="/" className="logo">
              <img src={logoSvg} alt="React" height="20" />
              <span className="logo__title">React</span>
            </a>
          </div>
          <nav className="header__nav">
            <div className="header__nav_mid">
              <div className="header__nav_inner">
                <ul className="nav">
                  <li className="nav__item">
                    <Link to="/docs/hello-world.html" className="nav__link">Docs</Link>
                  </li>
                  <li className="nav__item">
                    <a href="#" className="nav__link">Tutorial</a>
                  </li>
                  <li className="nav__item">
                    <a href="#" className="nav__link">Community</a>
                  </li>
                  <li className="nav__item">
                    <a href="#" className="nav__link">Blog</a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
          <form className="header__search">
            <label htmlFor="search">
              <img src={searchSvg} alt="Search" height="16" />
            </label>
            <div className="header__search_input">
              <input
                id="search"
                className="header__search_input_inner"
                type="search"
                placeholder="Search docs"
              />
            </div>
          </form>
          <div className="header__aux">
            <ul className="aux_list">
              <li className="aux_list__item">
                <a className="aux_list__link aux_list__btn" href="#">
                  v15.5.4
                </a>
              </li>
              <li className="aux_list__item">
                <a className="aux_list__link" href="#">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    {children()}

    <footer>
      <section className="footer">
        <div className="wrapper">
          <div className="footer__inner">
            <nav className="footer__category">
              <h2 className="footer__category_title">Docs</h2>
              <ul className="footer__list">
                <li className="footer__item">
                  <a href="#" className="footer__link">Quick Start</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Thinking in React</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Tutorial</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Advanced Guides</a>
                </li>
              </ul>
            </nav>
            <nav className="footer__category">
              <h2 className="footer__category_title">Community</h2>
              <ul className="footer__list">
                <li className="footer__item">
                  <a href="#" className="footer__link">Stack Overflow</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Discussion Forum</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Reactiflux Chat</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Facebook</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Twitter</a>
                </li>
              </ul>
            </nav>
            <nav className="footer__category">
              <h2 className="footer__category_title">Resources</h2>
              <ul className="footer__list">
                <li className="footer__item">
                  <a href="#" className="footer__link">Conferences</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Videos</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Examples</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Complementary Tools</a>
                </li>
              </ul>
            </nav>
            <nav className="footer__category">
              <h2 className="footer__category_title">More</h2>
              <ul className="footer__list">
                <li className="footer__item">
                  <a href="#" className="footer__link">Blog</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">GitHub</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">React Native</a>
                </li>
                <li className="footer__item">
                  <a href="#" className="footer__link">Acknowledgements</a>
                </li>
              </ul>
            </nav>
            <section className="footer__logo">
              <a href="#">
                <img src={ossLogoPng} alt="Facebook Open Source" />
              </a>
              <p className="footer__copyright">
                Copyright © 2017 Facebook Inc.
              </p>
            </section>
          </div>
        </div>
      </section>
    </footer>
  </div>
);

export default Template;
