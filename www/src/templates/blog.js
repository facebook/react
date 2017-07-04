import Link from 'gatsby-link';
import React from 'react';
import Helmet from 'react-helmet';
import {Sticky, StickyContainer} from 'react-sticky';
import PropTypes from 'prop-types';
import Sidebar from '../components/Sidebar';

// TODO Helment

const linkToTitle = link => link.replace(/-/g, ' ').replace('.html', '');

const Article = ({data, location}) => (
  <div className="site__main">
    <div className="wrapper">
      <StickyContainer className="article" id="nav_bounds">
        <article className="article__main below_nav">
          <div className="article__inner">
            <header className="article__header">
              <h1 className="article__title">
                {data.markdownRemark.frontmatter.title}
              </h1>
              <a
                className="article__edit_link underlined"
                href={`https://github.com/facebook/react/tree/master/docs/${data.markdownRemark.fields.path}`}>
                Edit this page
              </a>
            </header>
          </div>

          {/* TODO Add remark plugin if first child is paragraph, extract:
            ... this is handled with p:first-child for now
          <p className="article__sub article__inner">
            TODO
          </p>
          */}

          <div
            className="article__body article__inner"
            dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
          />
        </article>

        <Sticky>
          {({ style }) => (
            <div
              className="article__nav__wrapper below_nav"
              style={{
                ...style,
                width: 'auto',
              }}
            >
              <Sidebar data={data} location={location} />
            </div>
          )}
        </Sticky>
      </StickyContainer>

      <div className="article__traverse_nav">
        <ul className="traverse_nav">
          {/* TODO Read prev/next from index map, not this way */}
          {data.markdownRemark.frontmatter.prev &&
            <li className="traverse_nav__item">
              <div>
                <div className="traverse_nav__label">Previous article</div>
                <Link
                  className="traverse_nav__title underlined"
                  to={data.markdownRemark.frontmatter.prev}>
                  {linkToTitle(data.markdownRemark.frontmatter.prev)}
                </Link>
              </div>
            </li>}
          {data.markdownRemark.frontmatter.next &&
            <li className="traverse_nav__item">
              <div>
                <div className="traverse_nav__label">Next article</div>
                <Link
                  className="traverse_nav__title underlined"
                  to={data.markdownRemark.frontmatter.next}>
                  {linkToTitle(data.markdownRemark.frontmatter.next)}
                </Link>
              </div>
            </li>}
        </ul>
      </div>
    </div>
  </div>
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
        next
        prev
      }
      fields {
        path
      }
    }
  }
`;

export default Article;
