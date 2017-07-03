import React from 'react';
import Link from 'gatsby-link';
import Helmet from 'react-helmet';

import arrowSvg from '../icons/arrow.svg';

// TODO This doesn't get syntax highlighted properly.
// Figure out how to run it through prism instead of just getting the wrapper styles.
const SNIPPET = `class HelloMessage extends React.Component {
  render() {
    return (
      <div>
        Hello, {this.props.name}
      </div>
    );
  }
}

ReactDOM.render(
  <HelloMessage name=&quot;John&quot; />, mountNode
);`;

const Index = () => (
  <div>
    <main className="site__main home">
      <header className="hero below_nav">
        <div className="hero__inner">
          <div className="wrapper">
            <h1 className="hero__title">React</h1>
            <p className="hero__subtitle">
              A JavaScript library for building user interfaces
            </p>
            <div className="hero__cta_group cta_group">
              <div className="cta_group__item">
                <a href="#" className="primary_btn">
                  <span className="primary_btn__inner">Get Started</span>
                </a>
              </div>
              <div className="cta_group__item">
                <a href="#" className="cta_link">
                  Take the tutorial
                  {' '}
                  <img src={arrowSvg} alt="Search" height="12" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="wrapper">
        <section className="home_tabs">
          <ul className="home_tabs__list">
            <li className="home_tabs__item">
              <a href="#" className="home_tabs__link is-current">Declarative</a>
            </li>
            <li className="home_tabs__item">
              <a href="#" className="home_tabs__link">Component-based</a>
            </li>
            <li className="home_tabs__item">
              <a href="#" className="home_tabs__link">
                Learn once, write anywhere
              </a>
            </li>
          </ul>
          <section className="home_tabs__panel">
            <p>
              React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes. Declarative views make your code more predictable and easier to debug.
            </p>
          </section>
        </section>
      </div>

      <div className="wrapper">
        <section className="home_example">
          <div className="home_example__text">
            <h2 className="home_example__title">A simple component</h2>
            <div className="home_example__body">
              <p>
                React components implement a
                {' '}
                <code>render()</code>
                {' '}
                method that takes input data and returns what to display. This input data is accessed through
                {' '}
                <code>this.props</code>
                .
              </p>
            </div>
          </div>
          <div className="home_example__main">
            <div className="gatsby-highlight">
              <pre className="language-js">
                <code>{SNIPPET}</code>
              </pre>
            </div>
            <div className="home_example__result">
              <div>Hello, John</div>
            </div>
            <div className="home_example__note">
              <div className="small_note" />
            </div>
          </div>
        </section>
      </div>
    </main>
    <section className="prefooter_nav">
      <div className="wrapper">
        <div className="cta_group">
          <div className="cta_group__item">
            <a href="#" className="primary_btn">
              <span className="primary_btn__inner">Get Started</span>
            </a>
          </div>
          <div className="cta_group__item">
            <a href="#" className="cta_link">
              Take the tutorial
              <img src={arrowSvg} alt="Search" height="12" />
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default Index;
