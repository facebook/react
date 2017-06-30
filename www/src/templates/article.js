import React from 'react';
import Link from 'gatsby-link';
import Helmet from 'react-helmet';

const SNIPPET = `ReactDOM.render(
  &lt;h1&gt;Hello, world!&lt;/h1&gt;,
  document.getElementById('root')
);`;

const Article = () => (
  <main className="site__main">
    <div className="wrapper">
      <div className="article">
        <article className="article__main below_nav">
          <header className="article__header article__inner">
            <h1 className="article__title">Hello World</h1>
            <a href="#" className="article__edit_link underlined">
              Edit this page on GitHub
            </a>
          </header>

          <p className="article__sub article__inner">
            The easiest way to get started with React is to use this Hello World example code on CodePen. You don't need to install anything; you can just open it in another tab and follow along as we go through examples. If you'd rather use va local development environment, check out the Installation page.
          </p>

          <div className="article__body article__inner">
            <p>The smallest React example looks like this:</p>
            <div className="article__editor">
              <div className="editor code" data-readonly>
                <pre>{SNIPPET}</pre>
              </div>
            </div>
            <p>It renders a header saying "Hello World" on the page.</p>
            <p>
              The next few sections will gradually introduce you to using React. We will examine the building blocks of React apps: elements and components. Once you master them, you can create complex apps from small reusable pieces.
            </p>
            <div className="article__note">
              <div className="note">
                <p>
                  <strong>Caveat</strong><br />
                  Since JSX is closer to JavaScript than HTML, React DOM uses camelCase property naming convention instead of HTML attribute names.
                </p>
                <p>
                  For example, className becomes classNameName in JSX, and tabindex becomes tabIndex.
                </p>
              </div>
            </div>
            <h2>A Note on JavaScript</h2>
            <p>
              React is a JavaScript library, and so it assumes you have a basic understanding of the JavaScript language. If you don't feel very confident, we recommend refreshing your JavaScript knowledge so you can follow along more easily.
            </p>
            <p>
              We also use some of the ES6 syntax in the examples. We try to use it sparingly because it's still relatively new, but we encourage you to get familiar with arrow functions, classNamees, template literals, let, and const statements. You can use Babel REPL to check what ES6 code compiles to.
            </p>
          </div>

          <div className="article__traverse_nav">
            <ul className="traverse_nav">
              <li className="traverse_nav__item">
                <a href="#">
                  <div className="traverse_nav__label">Previous article</div>
                  <div className="traverse_nav__title underlined">
                    Introduction
                  </div>
                </a>
              </li>
              <li className="traverse_nav__item">
                <a href="#">
                  <div className="traverse_nav__label">Next article</div>
                  <div className="traverse_nav__title underlined">
                    Introducing JSX
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </article>

        <nav className="article__nav">
          <div className="article__nav_mid below_nav">
            <div className="article__nav_inner article_nav">
              <h2 className="article_nav__category_title is-current">
                Quick Start
              </h2>
              <ul className="vert_nav article_nav__list">
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Installation</span>
                  </a>
                </li>
                <li className="vert_nav__item is-current">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Hello World</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Introducing JSX</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Rendering Elements</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Components and Props</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">State and Lifecycle</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Handling Events</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">
                      Conditional Rendering
                    </span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Lists and Keys</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Forms</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Lifting State Up</span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">
                      Composition vs Inheritance
                    </span>
                  </a>
                </li>
                <li className="vert_nav__item">
                  <a href="#" className="vert_nav__link">
                    <span className="vert_nav__text">Thinking in React</span>
                  </a>
                </li>
              </ul>
              <h2 className="article_nav__category_title">
                <a href="#">Advanced Guides</a>
              </h2>
              <h2 className="article_nav__category_title">
                <a href="#">Reference</a>
              </h2>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </main>
);

export default Article;
