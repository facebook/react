import MarkdownPage from '../components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './blog.module.scss';
import sectionList from '../../../docs/_data/nav_docs.yml';

const BlogIndex = ({data}) => {
  console.log(data);
  console.log(data.allMarkdownRemark.edges[0]);
  return (
    <MarkdownPage
      author={data.allMarkdownRemark.edges[0].node.frontmatter.author}
      date={new Date(data.allMarkdownRemark.edges[0].node.fields.date)}
      location={location}
      markdownRemark={data.allMarkdownRemark.edges[0].node}
      sectionList={sectionList}
    />
  );
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query BlogPageQuery {
    allMarkdownRemark(
      filter: { id: { regex: "/_posts/" } }
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
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
          }
        }
      }
    }
  }
`;

export default BlogIndex;
