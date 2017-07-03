import Helmet from 'react-helmet';
import React from 'react';
import PropTypes from 'prop-types';
import Sidebar from './sidebar';

// TODO Helment

const Article = ({ data }) => (
  <main className="site__main">
    <div className="wrapper">
      <div className="article" id="nav_bounds">
        <article className="article__main below_nav">
          <header className="article__header article__inner">
            <h1 className="article__title">
              {data.markdownRemark.frontmatter.title}
            </h1>
            <a
              className="article__edit_link underlined"
              href={`https://github.com/facebook/react/tree/master/docs/${data.markdownRemark.fields.path}`}
            >
              Edit this page on GitHub
            </a>
          </header>

          {/* TODO Add remark plugin if first child is paragraph, extract:
          <p className="article__sub article__inner">
            TODO
          </p>
          */}

          <div
            className="article__body article__inner"
            dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
          />

        </article>

        <Sidebar />
      </div>

      <div className="article__traverse_nav">
        <ul className="traverse_nav">
          <li className="traverse_nav__item">
            <a href="#">
              <div className="traverse_nav__label">Continue reading</div>
              <div className="traverse_nav__title underlined">
                Introduction
              </div>
            </a>
          </li>
        </ul>
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
      fields {
        path
      }
    }
  }
`

export default Article;
