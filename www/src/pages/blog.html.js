import MarkdownPage from '../components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './blog.module.scss';

const BlogIndex = ({data}) => (
  <MarkdownPage
    author={data.markdownRemark.frontmatter.author}
    date={new Date(data.markdownRemark.fields.date)}
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionList}
  />
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query BlogPageQuery {
    allMarkdownRemark(
      limit: 1,
      sort: {fields: [fields___date], order: DESC},
      filter:{fields:{date: {ne:null}}}
    ) {
      edges {
        node {
          frontmatter {
            title
            date
            author {
              frontmatter {
                name
                url
              }
            }
          }
          fields {
            date
          }
        }
      }
    }
  }
`;

export default BlogIndex;
