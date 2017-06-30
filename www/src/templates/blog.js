import Helmet from 'react-helmet';
import React from 'react';
import PropTypes from 'prop-types';

// TODO Helment
// TODO Edit link

const Article = ({ data }) => (
  <main className="site__main">
    <div className="wrapper">
      <div className="article">
        <article className="article__main below_nav">
          <header className="article__header article__inner">
            <h1 className="article__title">
              {data.title}
            </h1>
            <a
              className="article__edit_link underlined"
              href={`https://github.com/facebook/react/tree/master/docs/${data.filepath}`}
            >
              Edit this page on GitHub
            </a>
          </header>

          <p className="article__sub article__inner">
            TODO
          </p>

          <div className="article__body article__inner">
            TODO
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

Article.propTypes = {
  data: PropTypes.object.isRequired,
};

export const pageQuery = graphql`
  query TemplateDocsMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`

export default Article;
