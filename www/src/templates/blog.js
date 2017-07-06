import MarkdownPage from '../components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';

const sectionList = []; // TODO

const Blog = ({data, location}) => (
  <MarkdownPage
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionList}
  />
);

Blog.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateBlogMarkdown($slug: String!) {
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

export default Blog;
