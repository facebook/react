import cn from 'classnames';
import Container from '../components/Container';
import docsearch from 'docsearch.js';
import Header from './components/Header';
import React from 'react';

import ossLogoPng from '../images/oss_logo.png';

// Global resets and Prism styles
import '../css/main.scss';

class Template extends React.Component {
  componentDidMount() {
    docsearch({
      apiKey: '36221914cce388c46d0420343e0bb32e',
      indexName: 'react',
      inputSelector: '#algolia-doc-search',
    });
  }

  render() {
    const {children, location} = this.props;

    return (
      <div className="site">
        <Header/>

        <main className="site__main">
          {children()}
        </main>

        <footer>
          <section className="footer">
            <Container>
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
                      <a href="#" className="footer__link">
                        Complementary Tools
                      </a>
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
            </Container>
          </section>
        </footer>
      </div>
    );
  }
}

export default Template;
