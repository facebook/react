import MarkdownPage from '../components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './blog.module.scss';

const sectionList = []; // TODO Load 10 most recent blog entries; see nav_blog.html

const BlogIndex = ({data}) => (
  <MarkdownPage
    author={data.allMarkdownRemark.edges[0].node.frontmatter.author}
    date={new Date(data.allMarkdownRemark.edges[0].node.fields.date)}
    location={location}
    markdownRemark={data.allMarkdownRemark.edges[0].node}
    sectionList={sectionList}
  />
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query BlogPageQuery {
    allMarkdownRemark(
      limit: 1,
      filter: { id: { regex: "/_posts/" } }
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
          html
          frontmatter {
            title
            author {
              frontmatter {
                name
                url
              }
            }
          }
          fields {
            date
            path
          }
        }
      }
    }
  }
`;

export default BlogIndex;
