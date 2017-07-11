import MarkdownPage from '../components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './blog.module.scss';

// TODO This is hacky, but this file is going away in favor of a redirect anyway.
// See comments in 'www/gatsby-node'
const toSectionList = allMarkdownRemark => [{
  title: 'Recent Posts',
  items: allMarkdownRemark.edges.map(({node}) => ({
    id: node.fields.slug,
    title: node.frontmatter.title,
  })).concat({
    id: '/blog/all.html',
    title: 'All posts ...',
  }),
}];

const BlogIndex = ({data, location}) => (
  <MarkdownPage
    authors={data.allMarkdownRemark.edges[0].node.frontmatter.author}
    date={new Date(data.allMarkdownRemark.edges[0].node.fields.date)}
    location={location}
    markdownRemark={data.allMarkdownRemark.edges[0].node}
    sectionList={toSectionList(data.allMarkdownRemark)}
  />
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query BlogPageQuery {
    allMarkdownRemark(
      limit: 10,
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
            slug
          }
        }
      }
    }
  }
`;

export default BlogIndex;
